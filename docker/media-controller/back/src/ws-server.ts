import { EventEmitter } from 'events';
import http from 'node:http';
import WebSocket from 'ws';

type WsServerEvents = {
    clientConnected: [];
    clientDisconnected: [];
    ready: [];
    keyboard: [key: string];
    bcpMessage: [message: string];
};

export class WsServer extends EventEmitter<WsServerEvents> {
    private clients: WebSocket[] = [];
    private httpServer: http.Server;
    private wss: WebSocket.WebSocketServer;

    constructor(port: number) {
        super();

        this.httpServer = http.createServer();
        this.wss = new WebSocket.WebSocketServer({ server: this.httpServer });

        this.wss.on('connection', (client) => {
            console.log('DMD client connection established');
            this.clients.push(client);
            this.emit('clientConnected');

            client.on('message', (rawMessage) => {
                const message = Buffer.isBuffer(rawMessage)
                    ? rawMessage.toString('utf8')
                    : Buffer.concat(Array.isArray(rawMessage) ? rawMessage : [Buffer.from(rawMessage)]).toString('utf8');
                this.handleMessage(message);
            });

            client.on('close', () => {
                const index = this.clients.indexOf(client);
                if (index > -1) this.clients.splice(index, 1);
                console.log(`DMD client disconnected. Remaining clients: ${this.clients.length}`);
                this.emit('clientDisconnected');
            });

            console.log(this.clients.length);
        });

        this.httpServer.listen(port, () => {
            console.log(`Websocket server listening for connection requests on socket localhost:${port}`);
        });
    }

    broadcast(message: string): void {
        this.clients.forEach(client => client.send(message));
    }

    get clientCount(): number {
        return this.clients.length;
    }

    private handleMessage(message: string): void {
        if (!message.startsWith('mc_')) {
            this.emit('bcpMessage', message);
            return;
        }

        const parts = message.split('?');
        const cmd = parts[0];
        const params: Record<string, string> = parts.length > 1
            ? Object.fromEntries(new URLSearchParams(parts[1]).entries())
            : {};

        switch (cmd) {
            case 'mc_ready':
                this.emit('ready');
                break;
            case 'mc_keyboard_event':
                this.emit('keyboard', params['key']);
                break;
            default:
                console.log('Unhandled message received from web client');
        }
    }
}
