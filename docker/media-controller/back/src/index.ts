import { BcpServer } from './bcp-server';
import { WsServer } from './ws-server';
import { Keyboard } from './keyboard';
import { MpfController } from './mpf';

const WEBSOCKET_PORT = 5000;
const BCP_PORT = 5050;

const bcpServer = new BcpServer(BCP_PORT);
const wsServer = new WsServer(WEBSOCKET_PORT);
const keyboard = new Keyboard('/mpf-config/config/keyboard.yaml');

let reset_sent = false;
let clients_ready = 0;
let mpfRunning = false;

// BCP -> WebSocket
bcpServer.on('connected', () => wsServer.broadcast('mc_connected'));
bcpServer.on('broadcast', (msg) => wsServer.broadcast(msg));
bcpServer.on('reset', () => {
    reset_sent = false;
    clients_ready = 0;
    wsServer.broadcast('mc_reset');
});
bcpServer.on('goodbye', () => {
    clients_ready = 0;
    reset_sent = false;
    mpfRunning = false;
});

// WebSocket -> BCP
wsServer.on('bcpMessage', (msg) => bcpServer.send(msg));
wsServer.on('keyboard', (key) => keyboard.onKeyPressed(key, (msg) => bcpServer.send(msg)));
wsServer.on('ready', () => {
    if (reset_sent) return;
    clients_ready++;
    if (clients_ready === wsServer.clientCount) {
        console.log('All clients are ready');
        bcpServer.send('reset_complete');
        reset_sent = true;
        mpfRunning = true;
    }
});

// WebSocket client lifecycle
wsServer.on('clientConnected', () => {
    keyboard.resetToggleStates();
    clients_ready = 0;
    reset_sent = false;
    mpfRunning = false;
    MpfController.stop(
        () => setTimeout(() => MpfController.start(() => wsServer.broadcast('mpf_launch_error')), 100),
        () => wsServer.broadcast('mpf_stop_error'),
    );
});
wsServer.on('clientDisconnected', () => {
    if (wsServer.clientCount === 0 && !mpfRunning) {
        clients_ready = 0;
        reset_sent = false;
    }
});

