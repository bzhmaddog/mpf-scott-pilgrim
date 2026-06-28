import fs from 'fs';
import yaml from 'js-yaml';
import net from 'net';
import http from 'node:http';
import WebSocket from 'ws';
import process from 'process';
import { parseMessageData, str2int, str2value, cleanParams } from './bcp.js';

const stdin = process.stdin;
if (stdin.isTTY) (stdin as { setRawMode: (mode: boolean) => void }).setRawMode(true);

stdin.resume();
stdin.setEncoding('utf8');

const WEBSOCKET_PORT = 5000;
const BCP_PORT = 5050;
const __version__ = '0.80.0';
const __bcp_version__ = '1.1';
const __config_version__ = '6';
const __mpf_version_required__ = '0.80.0';

const httpServer = http.createServer();

let tcpSocket: net.Socket | undefined;
const webSocketServer = new WebSocket.WebSocketServer({ server: httpServer });
const bcpServer = net.createServer((socket) => {
    tcpSocket = socket;
}).on('error', (err) => {
    throw err;
});

const clients: WebSocket[] = [];
let reset_sent = false;
let clients_ready = 0;
let mpfRunning = false;

interface KeyboardKey {
    switch: string;
    state: boolean;
    toggle: boolean;
}

const kbdKeys: Record<string, KeyboardKey> = {};

try {
    const fileContents = fs.readFileSync('/mpf-config/config/keyboard.yaml', 'utf8');
    const data = yaml.load(fileContents) as { keyboard?: Record<string, KeyboardKey> };

    if (typeof data.keyboard === 'object') {
        Object.keys(data.keyboard).forEach(k => {
            const sw = data.keyboard![k];
            sw.state = (sw.switch === 's_plunger'); // Tmp hack to force plunger state to true
            sw.toggle = sw.toggle || false;
            kbdKeys[k] = sw;
        });
    }
} catch (e) {
    console.log(e);
}

httpServer.listen(WEBSOCKET_PORT, function () {
    console.log(`Websocket server listening for connection requests on socket localhost:${WEBSOCKET_PORT}`);
});

bcpServer.listen(BCP_PORT, function () {
    console.log(`BCP server listening for connection requests on socket localhost:${BCP_PORT}`);
});

bcpServer.on('connection', function (socket) {
    console.log('BCP server : A new connection has been established.');

    clients.forEach(client => client.send('mc_connected'));

    socket.on('data', function (chunk) {
        const messages = chunk.toString().split('\n');

        messages.forEach(msg => {
            if (msg === '') return;

            const msgObj = parseMessageData(msg);

            switch (msgObj.command) {
                case 'hello':
                    bcpSend(`hello?version=${__version__}`);
                    clients.forEach(client => client.send('mc_hello'));
                    break;
                case 'reset':
                    reset_sent = false;
                    clients_ready = 0;
                    clients.forEach(client => client.send('mc_reset'));
                    break;
                case 'machine_variable': {
                    const parsedParams: Record<string, unknown> = 'json' in msgObj.params
                        ? JSON.parse(msgObj.params['json']) as Record<string, unknown>
                        : msgObj.params;

                    const rawValue = parsedParams['value'];
                    let v: string | number;
                    if (typeof rawValue === 'object' && rawValue !== null) {
                        v = JSON.stringify(rawValue);
                    } else if (typeof rawValue === 'string' || typeof rawValue === 'number') {
                        v = str2value(String(rawValue));
                    } else {
                        v = '';
                    }

                    const name = typeof parsedParams['name'] === 'string' ? parsedParams['name'] : '';
                    clients.forEach(client => client.send(`mc_machine_variable?${name}=${v}`));
                    break;
                }
                case 'settings': {
                    const settingsObj = JSON.parse(msgObj.params['json']) as { settings: unknown };
                    console.log('Settings received', msgObj);
                    clients.forEach(client => client.send(`mc_settings?settings=${JSON.stringify(settingsObj.settings)}`));
                    break;
                }
                case 'mode_start': {
                    const modeName: string = msgObj.params.name;
                    const modePriority = str2int(msgObj.params.priority);
                    console.log('Starting mode :', modeName);
                    clients.forEach(client => client.send(`mc_mode_start?name=${modeName}&priority=${modePriority}`));
                    break;
                }
                case 'mode_stop': {
                    const modeName: string = msgObj.params.name;
                    console.log('Stopping mode :', modeName);
                    clients.forEach(client => client.send(`mc_mode_stop?name=${modeName}`));
                    break;
                }
                case 'player_variable': {
                    console.log('Player variable changed : ', msgObj.params);
                    clients.forEach(client => client.send('mc_player_variable?variables=' + cleanParams(msgObj.params)));
                    break;
                }
                case 'player_added':
                    clients.forEach(client => client.send('mc_player_added'));
                    break;
                case 'player_turn_start': {
                    const p = str2int(msgObj.params.player_num);
                    clients.forEach(client => client.send(`mc_player_turn_start?player_num=${p}`));
                    break;
                }
                case 'ball_start': {
                    const p = str2int(msgObj.params.player_num);
                    const b = str2int(msgObj.params.ball);
                    clients.forEach(client => client.send(`mc_ball_start?player_num=${p}&ball=${b}`));
                    break;
                }
                case 'ball_end':
                    clients.forEach(client => client.send('mc_ball_end'));
                    break;
                case 'mode_list':
                    break;
                case 'status_request':
                    // TODO: Send real data
                    break;
                case 'switch': {
                    const name: string = msgObj.params.name;
                    const state = str2int(msgObj.params.state);
                    clients.forEach(client => client.send(`mc_switch?name=${name}&state=${state}`));
                    break;
                }
                case 'goodbye':
                    clients_ready = 0;
                    reset_sent = false;
                    mpfRunning = false;
                    clients.forEach(client => client.send('mc_goodbye'));
                    break;
                case 'error': {
                    const message: string = msgObj.params.message;
                    const command: string = msgObj.params.command;
                    clients.forEach(client => client.send(`mc_error?message=${message}&command=${command}`));
                    break;
                }
                default:
                    console.log('Received unhandled message from mpf :', msg);
            }
        });
    });

    socket.on('end', function () {
        console.log('Closing connection with the mpf client');
    });

    socket.on('error', function (err) {
        console.log(`BCP server error: ${err}`);
    });

    const encoded_extended_version = encodeURI(`MPF-MC v${__version__} (config_version=${__config_version__}, BCP v${__bcp_version__}, Requires MPF v${__mpf_version_required__})`);

    bcpSend(`set_machine_var?name=mc_version&value=MPF-MC ${__version__}`);
    bcpSend(`set_machine_var?name=mc_extended_version&value=${encoded_extended_version}`);
    bcpSend('monitor_start?category=machine_vars');
    bcpSend('monitor_start?category=player_vars');
    bcpSend('monitor_start?category=modes');
    bcpSend('monitor_start?category=core_events');
    bcpSend('monitor_start?category=status_request');
});


webSocketServer.on('connection', function connection(_client: WebSocket) {
    console.log('DMD client connection established');
    clients.push(_client);

    _client.on('message', function incoming(rawMessage: WebSocket.RawData) {
        const message = Buffer.isBuffer(rawMessage)
            ? rawMessage.toString('utf8')
            : Buffer.concat(Array.isArray(rawMessage) ? rawMessage : [Buffer.from(rawMessage)]).toString('utf8');
        if (message.startsWith('mc_')) {
            handleLocalMessages(message);
        } else {
            bcpSend(message);
        }
    });

    _client.on('close', function () {
        const index = clients.indexOf(_client);
        if (index > -1) {
            clients.splice(index, 1);
        }
        console.log(`DMD client disconnected. Remaining clients: ${clients.length}`);
        if (clients.length === 0 && !mpfRunning) {
            clients_ready = 0;
            reset_sent = false;
        }
    });

    // Reset togglable switches
    Object.entries(kbdKeys).filter(([, obj]) => obj.toggle).forEach(([key]) => {
        kbdKeys[key].state = false;
    });

    clients_ready = 0;
    reset_sent = false;
    mpfRunning = false;

    http.get({
        hostname: 'mpf',
        port: 5000,
        path: '/stop',
        agent: false,
    }, (response) => {
        const { statusCode } = response;

        if (statusCode !== 200) {
            clients.forEach((client) => client.send('mpf_stop_error'));
        } else {
            setTimeout(startMpf, 100);
        }
    }).on('error', () => {
        setTimeout(startMpf, 100);
    });

    console.log(clients.length);
});

function handleLocalMessages(data: string): void {
    const parts = data.split('?');
    let cmd = '';
    let params: Record<string, string> = {};

    if (parts.length > 1) {
        const urlSearchParams = new URLSearchParams(parts[1]);
        params = Object.fromEntries(urlSearchParams.entries());
        cmd = parts[0];
    } else {
        cmd = data;
    }

    switch (cmd) {
        case 'mc_ready':
            if (!reset_sent) {
                clients_ready++;

                if (clients_ready === clients.length) {
                    console.log('All clients are ready');
                    bcpSend('reset_complete');
                    reset_sent = true;
                    mpfRunning = true;
                }
            }
            break;
        case 'mc_keyboard_event': {
            const key = params['key'];
            console.log('key pressed');
            onKeyPressed(key);
            break;
        }
        default:
            console.log('Unhandled message received from web client');
    }
}

stdin.on('data', function (key: string) {
    if (key === '') {
        process.exit();
    }
    onKeyPressed(key);
});

function bcpSend(message: string): void {
    console.log(`Sending message to mpf : ${message}`);
    tcpSocket!.write(message + '\n');
}


function startMpf(): void {
    http.get({
        hostname: 'mpf',
        port: 5000,
        path: '/start',
        agent: false,
    }, (response) => {
        const { statusCode } = response;

        if (statusCode !== 200) {
            clients.forEach((client) => client.send('mpf_launch_error'));
        }
    });
}

function onKeyPressed(key: string): void {
    if (typeof kbdKeys[key] === 'object') {
        if (kbdKeys[key].toggle === true) {
            kbdKeys[key].state = !kbdKeys[key].state;
            const state = kbdKeys[key].state ? 1 : 0;
            bcpSend(`switch?name=${kbdKeys[key].switch}&state=${state}`);
        } else {
            bcpSend(`switch?name=${kbdKeys[key].switch}&state=1`);
            bcpSend(`switch?name=${kbdKeys[key].switch}&state=0`);
        }
    } else {
        console.log(`Unhandled key pressed => ${key}`);
    }
}
