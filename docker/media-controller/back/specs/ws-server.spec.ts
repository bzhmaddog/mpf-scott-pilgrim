import { describe, it, expect, afterEach, vi } from 'vitest';

vi.mock('ws', () => {
    class WebSocketServer {
        on() { return this; }
    }
    return { default: { WebSocketServer }, WebSocketServer };
});

import { WsServer } from '../src/ws-server';

interface WsServerInternals {
    handleMessage(message: string): void;
    httpServer: { close(): void };
}

describe('WsServer.handleMessage', () => {
    let active: WsServer | undefined;

    afterEach(() => {
        (active as unknown as WsServerInternals)?.httpServer.close();
        active = undefined;
    });

    function makeServer(): WsServer {
        const server = new WsServer(0);
        active = server;
        return server;
    }

    it('emits bcpMessage for non mc_ messages', () => {
        const server = makeServer();
        const internal = server as unknown as WsServerInternals;
        let forwarded: string | undefined;
        server.on('bcpMessage', (m) => { forwarded = m; });
        internal.handleMessage('switch?name=s_start&state=1');
        expect(forwarded).toBe('switch?name=s_start&state=1');
    });

    it('emits ready for mc_ready', () => {
        const server = makeServer();
        const internal = server as unknown as WsServerInternals;
        let ready = false;
        server.on('ready', () => { ready = true; });
        internal.handleMessage('mc_ready');
        expect(ready).toBe(true);
    });

    it('emits keyboard with key for mc_keyboard_event', () => {
        const server = makeServer();
        const internal = server as unknown as WsServerInternals;
        let key: string | undefined;
        server.on('keyboard', (k) => { key = k; });
        internal.handleMessage('mc_keyboard_event?key=a');
        expect(key).toBe('a');
    });

    it('starts with zero clients', () => {
        const server = makeServer();
        expect(server.clientCount).toBe(0);
    });
});
