import { describe, it, expect, afterEach, vi } from 'vitest';
import { BcpServer } from '../src/bcp-server';

interface BcpServerInternals {
    handleData(chunk: Buffer): void;
    server: { close(): void };
    tcpSocket: { write(msg: string): void };
}

function makeServer(): { server: BcpServer; feed: (msg: string) => void } {
    const server = new BcpServer(0);
    const internal = server as unknown as BcpServerInternals;
    internal.tcpSocket = { write: () => {} };
    return { server, feed: (msg: string) => internal.handleData(Buffer.from(msg + '\n')) };
}

describe('BcpServer.handleMessage', () => {
    let active: BcpServer | undefined;

    afterEach(() => {
        (active as unknown as BcpServerInternals)?.server.close();
        active = undefined;
    });

    it('responds to hello with mc_hello', () => {
        const { server, feed } = makeServer();
        active = server;
        const seen: string[] = [];
        server.on('broadcast', (m) => seen.push(m));
        feed('hello?version=0.81.0');
        expect(seen).toContain('mc_hello');
    });

    it('emits reset', () => {
        const { server, feed } = makeServer();
        active = server;
        let reset = false;
        server.on('reset', () => { reset = true; });
        feed('reset');
        expect(reset).toBe(true);
    });

    it('emits goodbye and broadcasts mc_goodbye', () => {
        const { server, feed } = makeServer();
        active = server;
        let goodbye = false;
        const seen: string[] = [];
        server.on('goodbye', () => { goodbye = true; });
        server.on('broadcast', (m) => seen.push(m));
        feed('goodbye');
        expect(goodbye).toBe(true);
        expect(seen).toContain('mc_goodbye');
    });

    it('forwards player_turn_start with parsed player_num', () => {
        const { server, feed } = makeServer();
        active = server;
        const seen: string[] = [];
        server.on('broadcast', (m) => seen.push(m));
        feed('player_turn_start?player_num=int:1');
        expect(seen).toContain('mc_player_turn_start?player_num=1');
    });

    it('forwards ball_start with parsed values', () => {
        const { server, feed } = makeServer();
        active = server;
        const seen: string[] = [];
        server.on('broadcast', (m) => seen.push(m));
        feed('ball_start?player_num=int:2&ball=int:3');
        expect(seen).toContain('mc_ball_start?player_num=2&ball=3');
    });

    it('forwards switch', () => {
        const { server, feed } = makeServer();
        active = server;
        const seen: string[] = [];
        server.on('broadcast', (m) => seen.push(m));
        feed('switch?name=s_plunger&state=int:1');
        expect(seen).toContain('mc_switch?name=s_plunger&state=1');
    });

    it('handles machine_variable from json', () => {
        const { server, feed } = makeServer();
        active = server;
        const seen: string[] = [];
        server.on('broadcast', (m) => seen.push(m));
        feed('machine_variable?json=' + encodeURIComponent('{"name":"credits","value":"int:5"}'));
        expect(seen).toContain('mc_machine_variable?credits=5');
    });

    it('ignores empty and unknown commands without broadcasting', () => {
        const { server, feed } = makeServer();
        active = server;
        const seen: string[] = [];
        server.on('broadcast', (m) => seen.push(m));
        feed('mode_list');
        feed('totally_unknown');
        expect(seen).toHaveLength(0);
    });
});

describe('BcpServer logging', () => {
    let active: BcpServer | undefined;

    afterEach(() => {
        (active as unknown as BcpServerInternals)?.server.close();
        active = undefined;
        vi.restoreAllMocks();
    });

    function logsFor(msg: string): string[] {
        const { server, feed } = makeServer();
        active = server;
        const log = vi.spyOn(console, 'log').mockImplementation(() => {});
        feed(msg);
        return log.mock.calls.map((args) => args.join(' '));
    }

    it.each([
        ['settings', 'settings?json={"settings":{"a":1}}&extra=a%0AFAKE', 'Settings received'],
        ['mode_start', 'mode_start?name=attract%0AFAKE&priority=int:10', 'Starting mode: attract\\nFAKE'],
        ['mode_stop', 'mode_stop?name=attract%0AFAKE', 'Stopping mode: attract\\nFAKE'],
        ['player_variable', 'player_variable?name=score%0AFAKE&value=int:10', 'Player variable changed:'],
        ['unhandled', 'unknown_cmd%0AFAKE', 'Received unhandled message from mpf:'],
    ])('%s logs MPF input on a single line', (_name, msg, expected) => {
        const lines = logsFor(msg).filter((line) => line.includes(expected));
        expect(lines.length).toBeGreaterThan(0);
        for (const line of lines) {
            expect(line).not.toMatch(/[\r\n]/);
        }
    });
});
