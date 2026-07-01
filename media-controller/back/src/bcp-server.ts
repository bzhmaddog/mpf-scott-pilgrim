import { EventEmitter } from 'events';
import net from 'net';
import { parseMessageData, str2int, str2value, cleanParams } from './bcp';

const __version__ = '0.80.0';
const __bcp_version__ = '1.1';
const __config_version__ = '6';
const __mpf_version_required__ = '0.80.0';

type BcpServerEvents = {
    connected: [];
    disconnected: [];
    broadcast: [message: string];
    reset: [];
    goodbye: [];
};

export class BcpServer extends EventEmitter<BcpServerEvents> {
    private tcpSocket: net.Socket | undefined;
    private server: net.Server;

    constructor(port: number) {
        super();

        this.server = net.createServer((socket) => {
            this.tcpSocket = socket;
            console.log('BCP server: A new connection has been established.');
            this.emit('connected');
            this.sendInitMessages();

            socket.on('data', (chunk) => this.handleData(chunk));
            socket.on('end', () => {
                console.log('Closing connection with the mpf client');
                this.emit('disconnected');
            });
            socket.on('error', (err) => {
                console.log(`BCP server error: ${err}`);
            });
        }).on('error', (err) => { throw err; });

        this.server.listen(port, () => {
            console.log(`BCP server listening for connection requests on socket localhost:${port}`);
        });
    }

    send(message: string): void {
        console.log(`Sending message to mpf: ${message}`);
        this.tcpSocket!.write(message + '\n');
    }

    private sendInitMessages(): void {
        const encoded_extended_version = encodeURI(`MPF-MC v${__version__} (config_version=${__config_version__}, BCP v${__bcp_version__}, Requires MPF v${__mpf_version_required__})`);
        this.send(`set_machine_var?name=mc_version&value=MPF-MC ${__version__}`);
        this.send(`set_machine_var?name=mc_extended_version&value=${encoded_extended_version}`);
        this.send('monitor_start?category=machine_vars');
        this.send('monitor_start?category=player_vars');
        this.send('monitor_start?category=modes');
        this.send('monitor_start?category=core_events');
        this.send('monitor_start?category=status_request');
    }

    private handleData(chunk: Buffer): void {
        chunk.toString().split('\n').forEach(msg => {
            if (msg === '') return;
            const { command, params } = parseMessageData(msg);
            this.handleMessage(command, params);
        });
    }

    private handleMessage(command: string, params: Record<string, string>): void {
        switch (command) {
            case 'hello':
                this.send(`hello?version=${__version__}`);
                this.emit('broadcast', 'mc_hello');
                break;
            case 'reset':
                this.emit('reset');
                break;
            case 'machine_variable': {
                const parsedParams: Record<string, unknown> = 'json' in params
                    ? JSON.parse(params['json']) as Record<string, unknown>
                    : params;
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
                this.emit('broadcast', `mc_machine_variable?${name}=${v}`);
                break;
            }
            case 'settings': {
                const settingsObj = JSON.parse(params['json']) as { settings: unknown };
                console.log('Settings received', command, params);
                this.emit('broadcast', `mc_settings?settings=${JSON.stringify(settingsObj.settings)}`);
                break;
            }
            case 'mode_start': {
                const modeName = params.name;
                const modePriority = str2int(params.priority);
                console.log('Starting mode:', modeName);
                this.emit('broadcast', `mc_mode_start?name=${modeName}&priority=${modePriority}`);
                break;
            }
            case 'mode_stop':
                console.log('Stopping mode:', params.name);
                this.emit('broadcast', `mc_mode_stop?name=${params.name}`);
                break;
            case 'player_variable':
                console.log('Player variable changed:', params);
                this.emit('broadcast', 'mc_player_variable?variables=' + cleanParams(params));
                break;
            case 'player_added':
                this.emit('broadcast', 'mc_player_added');
                break;
            case 'player_turn_start':
                this.emit('broadcast', `mc_player_turn_start?player_num=${str2int(params.player_num)}`);
                break;
            case 'ball_start':
                this.emit('broadcast', `mc_ball_start?player_num=${str2int(params.player_num)}&ball=${str2int(params.ball)}`);
                break;
            case 'ball_end':
                this.emit('broadcast', 'mc_ball_end');
                break;
            case 'mode_list':
            case 'status_request':
                // TODO: Send real data
                break;
            case 'switch':
                this.emit('broadcast', `mc_switch?name=${params.name}&state=${str2int(params.state)}`);
                break;
            case 'goodbye':
                this.emit('goodbye');
                this.emit('broadcast', 'mc_goodbye');
                break;
            case 'error':
                this.emit('broadcast', `mc_error?message=${params.message}&command=${params.command}`);
                break;
            default:
                console.log('Received unhandled message from mpf:', command);
        }
    }
}
