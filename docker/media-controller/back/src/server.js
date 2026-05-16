const fs = require('fs'),
    yaml = require('js-yaml'),
    net = require('net'),
    http = require("node:http"),
    rl = require('readline'),
    WebSocketServer = require('ws').Server,
    process = require('process'),
    os = require('os-utils'),
    stdin = process.stdin;

// without this, we would only get streams once enter is pressed
if (stdin.isTTY) stdin.setRawMode(true);

stdin.resume();
stdin.setEncoding('utf8');

const WEBSOCKET_PORT = 5000;
const BCP_PORT = 5050;
const __version__ = '0.80.0'
const __short_version__ = '0.80'
const __bcp_version__ = '1.1'
const __config_version__ = '6'
const __mpf_version_required__ = '0.80.0'
const startUsage = process.cpuUsage();

const httpServer = http.createServer();

let tcpSocket;
let webSocketServer = new WebSocketServer({server: httpServer});
let bcpServer = net.createServer((socket) => {
    tcpSocket = socket;
}).on('error', (err) => {
    throw err;
});

let clients = [];
let reset_sent = false;
let clients_ready = 0;
let mpfRunning = false;
let reconnectingClients = new Set();
let kbdKeys = {};

let mpf = {
    //settings: {},
    mVars: {},
    modes: [],
    mode: {},
};

try {
    let fileContents = fs.readFileSync('/mpf-config/config/keyboard.yaml', 'utf8');
    let data = yaml.load(fileContents);

    if (typeof data.keyboard === 'object') {
        Object.keys(data.keyboard).forEach(k => {
            let sw = data.keyboard[k];
            sw.state = (sw.switch === 's_plunger'); // Tmp hack to force plunger state to true
            sw.toggle = sw.toggle || false;
            kbdKeys[k] = sw;
        });

        //console.log(kbdKeys);
    }
} catch (e) {
    console.log(e);
}

//console.log(webSocketServer);

httpServer.listen(WEBSOCKET_PORT, function () {
    console.log(`Websocket server listening for connection requests on socket localhost:${WEBSOCKET_PORT}`);
});

bcpServer.listen(BCP_PORT, function () {
    console.log(`BCP server listening for connection requests on socket localhost:${BCP_PORT}`);
});

bcpServer.on('connection', function (socket) {
    console.log('BCP server : A new connection has been established.');

    // Send message to UI (just for debugging)
    clients.forEach(client => client.send('mc_connected'));

    // The server can also receive data from the client by reading from its socket.
    socket.on('data', function (chunk) {

        // Split received data in multiple messages
        let messages = chunk.toString().split('\n');

        //handle all messages and forward them to the UIs
        messages.forEach(msg => {
            //console.log(msg);
            if (msg === "") return;

            let msgObj = parseMessageData(msg);

            switch (msgObj.command) {
                case 'hello':
                    bcpSend(`hello?version=${__version__}`);
                    clients.forEach(client => client.send('mc_hello'));
                    break;
                case 'reset':
                    reset_sent = false;
                    clients.forEach(client => client.send('mc_reset'));
                    break;
                case 'machine_variable':
                    let v;

                    if (msgObj.params.hasOwnProperty('json')) {
                        msgObj.params = JSON.parse(msgObj.params.json);
                    }

                    if (msgObj.params.hasOwnProperty('name') && msgObj.params.hasOwnProperty('value')) {
                        //console.log('here', msgObj);
                        mpf.mVars[msgObj.params.name] = str2value(msgObj.params.value);
                    }

                    if (typeof msgObj.params.value === 'object') {
                        v = JSON.stringify(msgObj.params.value);
                    } else {
                        //console.log('there', msgObj);
                        v = str2value(msgObj.params.value);
                    }

                    clients.forEach(client => client.send('mc_machine_variable?' + msgObj.params.name + '=' + v));
                    break;
                case 'settings':
                    const settingsObj = JSON.parse(msgObj.params['json']);
                    const settings = settingsObj.settings;
                    console.log("Settings received", msgObj);
                    clients.forEach(client => client.send(`mc_settings?settings=${JSON.stringify(settings)}`));
                    break;
                case 'mode_start':
                    mpf.mode = {
                        name: msgObj.params.name,
                        priority: str2int(msgObj.params.priority)
                    };
                    console.log("Starting mode XXXXX :", mpf.mode);
                    clients.forEach(client => client.send('mc_mode_start?name=' + msgObj.params.name + '&priority=' + str2value(msgObj.params.priority)));
                    break;
                case 'mode_stop':
                    console.log("Stopping mode :", msgObj.params.name);
                    clients.forEach(client => client.send('mc_mode_stop?name=' + msgObj.params.name));
                    break;
                case 'player_variable':
                    console.log("Player variable changed : ", msgObj.params);
                    //var cleanedParams = cleanParams(msgObj.params);
                    clients.forEach(client => client.send('mc_player_variable?variables=' + cleanParams(msgObj.params)));
                    break;
                case 'player_added':
                    clients.forEach(client => client.send('mc_player_added'));
                    break;
                case 'player_turn_start': {
                    let p = str2int(msgObj.params.player_num);
                    clients.forEach(client => client.send(`mc_player_turn_start?player_num=${p}`));
                    break;
                }
                case 'ball_start': {
                    let p = str2int(msgObj.params.player_num);
                    let b = str2int(msgObj.params.ball);
                    clients.forEach(client => client.send(`mc_ball_start?player_num=${p}&ball=${b}`));
                    break;
                }
                case 'ball_end':
                    clients.forEach(client => client.send(`mc_ball_end`));
                    break;
                case 'mode_list':
                    let jsonObj = JSON.parse(msgObj.params.json);
                    mpf.modes = [];
                    jsonObj.running_modes.forEach(mode => {
                        mpf.modes.push({
                            name: mode[0],
                            priority: mode[1],
                            running: true
                        });
                    });
                    console.log("List of modes :", mpf.modes);
                    break;
                case 'status_request':
                    // TODO : Send real data
                    //bcpSend(`status_report?cpu=${float2str(5.68, 1)}&vms=${int2str(123912192)}&rss=${int2str(1772883968)}`);
                    break;
                case 'switch':
                    let name = msgObj.params.name;
                    let state = str2int(msgObj.params.state);
                    clients.forEach(client => client.send(`mc_switch?name=${name}&state=${state}`));
                    break;
                case 'goodbye':
                    clients_ready = 0;
                    reset_sent = false;
                    mpfRunning = false;
                    clients.forEach(client => client.send('mc_goodbye'));
                    break;
                case 'error':
                    let message = msgObj.params.message;
                    let command = msgObj.params.command;
                    clients.forEach(client => client.send(`mc_error?message=${message}&command=${command}`));
                    break;
                default:
                    console.log("Received unhandled message from mpf :", msg);

            }

            //clients.forEach(client => client.send('mc_' + msg));
        });
    });

    // When the client requests to end the TCP connection with the server, the server
    // ends the connection.
    socket.on('end', function () {
        console.log('Closing connection with the mpf client');
    });

    // Don't forget to catch error, for your own sake.
    socket.on('error', function (err) {
        console.log(`BCP server error: ${err}`);
    });

    const encoded_extended_version = encodeURI(`MPF-MC v${__version__} (config_version=${__config_version__}, BCP v${__bcp_version__}, Requires MPF v${__mpf_version_required__})`)

    bcpSend(`set_machine_var?name=mc_version&value=MPF-MC ${__version__}`);
    bcpSend(`set_machine_var?name=mc_extended_version&value=${encoded_extended_version}`);
    bcpSend("monitor_start?category=machine_vars");
    bcpSend("monitor_start?category=player_vars");
    bcpSend("monitor_start?category=modes");
    bcpSend("monitor_start?category=core_events");
    bcpSend("monitor_start?category=status_request");
});


webSocketServer.on('connection', function connection(_client) {
    console.log('DMD client connection established');
    clients.push(_client);

    _client.on('message', function incoming(message) {
        if (message.startsWith('mc_')) {
            handleLocalMessages(message, _client);
        } else {
            bcpSend(message);
        }
    });

    _client.on('close', function () {
        const index = clients.indexOf(_client);
        if (index > -1) {
            clients.splice(index, 1);
        }
        reconnectingClients.delete(_client);
        console.log(`DMD client disconnected. Remaining clients: ${clients.length}`);
        if (clients.length === 0 && !mpfRunning) {
            clients_ready = 0;
            reset_sent = false;
        }
    });

    // Reset toggable switches
    Object.entries(kbdKeys).filter(([, obj])=> obj.toggle).forEach(([key]) => {
        kbdKeys[key].state = false;
    })

    if (mpfRunning) {
        console.log('MPF already running, reconnecting client');
        reconnectingClients.add(_client);
        _client.send('mc_reset');
    } else {
        http.get({
            hostname: 'mpf',
            port: 5000,
            path: '/stop',
            agent: false,
        }, (response) => {
            const {statusCode} = response;

            if (statusCode !== 200) {
                clients.forEach((client) => client.send('mpf_stop_error'))
            } else {
                setTimeout(startMpf, 100);
            }
        });
    }

    console.log(clients.length);

});

function parseMessageData(message) {
    const parts = message.split('?');
    let cmd = message;
    let params = {};

    if (parts.length > 1) {
        const urlSearchParams = new URLSearchParams(parts[1]);
        params = Object.fromEntries(urlSearchParams.entries());
        cmd = parts[0];
    }

    return {
        command: cmd,
        params: params
    }
}

function sendStateSnapshot(client) {
    if (tcpSocket) client.send('mc_hello');
    Object.entries(mpf.mVars).forEach(([name, value]) => {
        const v = typeof value === 'object' ? JSON.stringify(value) : value;
        client.send(`mc_machine_variable?${name}=${v}`);
    });
    mpf.modes.forEach(mode => {
        client.send(`mc_mode_start?name=${mode.name}&priority=${mode.priority}`);
    });
}

function handleLocalMessages(data, sender) {
    const parts = data.split('?');
    let cmd = "";
    let params = {};

    //console.log(data);

    if (parts.length > 1) {
        const urlSearchParams = new URLSearchParams(parts[1]);
        params = Object.fromEntries(urlSearchParams.entries());
        cmd = parts[0];
    } else {
        cmd = data;
    }

    switch (cmd) {
        case 'mc_ready':
            if (reconnectingClients.has(sender)) {
                reconnectingClients.delete(sender);
                console.log('Reconnecting client ready, sending state snapshot');
                sendStateSnapshot(sender);
            } else if (!reset_sent) {
                clients_ready++;

                if (clients_ready === clients.length) {
                    console.log('All clients are ready')
                    bcpSend('reset_complete');
                    reset_sent = true;
                    mpfRunning = true;
                    console.log(mpf);
                }
            }
            break;
        case 'mc_keyboard_event':
            const key = params['key'];

            console.log('key pressed');

            onKeyPressed(key);

            break;
        default:
            console.log(`Unhandled message received from web client`);
    }

}

// on any data into stdin
stdin.on('data', function (key) {
    // ctrl-c ( end of text )
    if (key === '\u0003') {
        process.exit();
    }
    onKeyPressed(key);
});


function bcpSend(message) {
    console.log(`Sending message to mpf : ${message}`);
    tcpSocket.write(message + '\n');
}

function str2int(str) {
    return parseInt(str.replace('int:', ''), 10);
}

function str2value(str) {
    if (!str) {
        console.log("str2value(): Empty var");
        return "";
    }

    if (str.toString().startsWith('int:')) {
        return parseInt(str.replace('int:', ''), 10);
    } else if (str.toString().startsWith('float:')) {
        return parseFloat(str.replace('float:', ''));
    } else {
        return str.toString();
    }
}

function int2str(v) {
    return `int:${v}`;
}

function float2str(v, d) {
    return `float:${v.toFixed(d)}`;
}

function cleanParams(obj) {
    return JSON.stringify(obj).replace(/"(int|float):(\d+)"/gi, "$2");
}

function startMpf() {
    http.get({
        hostname: 'mpf',
        port: 5000,
        path: '/start',
        agent: false,  // Create a new agent just for this one request
    }, (response) => {
        const {statusCode} = response;

        if (statusCode !== 200) {
            clients.forEach((client) => client.send('mpf_launch_error'))
        }
    });
}

function onKeyPressed(key) {
    if (typeof kbdKeys[key] === 'object') {
        if (kbdKeys[key].toggle === true) {
            kbdKeys[key].state = !kbdKeys[key].state;
            let state = kbdKeys[key].state ? 1 : 0;
            bcpSend(`switch?name=${kbdKeys[key].switch}&state=${state}`);
        } else {
            bcpSend(`switch?name=${kbdKeys[key].switch}&state=1`);
            bcpSend(`switch?name=${kbdKeys[key].switch}&state=0`);
        }

    } else {
        console.log(`Unhandled key pressed => ${key}`);
    }
}