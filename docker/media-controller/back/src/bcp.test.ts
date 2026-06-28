import { describe, it, expect } from 'vitest';
import { parseMessageData, str2int, str2value, cleanParams } from './bcp.js';

describe('parseMessageData', () => {
    it('parses a command with no params', () => {
        expect(parseMessageData('hello')).toEqual({ command: 'hello', params: {} });
    });

    it('parses a command with a single param', () => {
        expect(parseMessageData('hello?version=0.80.0')).toEqual({
            command: 'hello',
            params: { version: '0.80.0' },
        });
    });

    it('parses a command with multiple params', () => {
        expect(parseMessageData('mc_ball_start?player_num=int:1&ball=int:2')).toEqual({
            command: 'mc_ball_start',
            params: { player_num: 'int:1', ball: 'int:2' },
        });
    });

    it('handles URL-encoded param values', () => {
        const result = parseMessageData('switch?name=s_plunger&state=int:1');
        expect(result.params['name']).toBe('s_plunger');
        expect(result.params['state']).toBe('int:1');
    });
});

describe('str2int', () => {
    it('strips int: prefix and parses', () => {
        expect(str2int('int:5')).toBe(5);
    });

    it('parses a plain integer string', () => {
        expect(str2int('42')).toBe(42);
    });
});

describe('str2value', () => {
    it('returns empty string for empty input', () => {
        expect(str2value('')).toBe('');
    });

    it('parses int: prefix', () => {
        expect(str2value('int:42')).toBe(42);
    });

    it('parses float: prefix', () => {
        expect(str2value('float:3.14')).toBeCloseTo(3.14);
    });

    it('returns plain strings as-is', () => {
        expect(str2value('attract')).toBe('attract');
    });
});

describe('cleanParams', () => {
    it('passes through plain string values', () => {
        expect(cleanParams({ name: 'attract' })).toBe('{"name":"attract"}');
    });

    it('strips int: prefix from numeric values', () => {
        expect(cleanParams({ score: 'int:1000' })).toBe('{"score":1000}');
    });

    it('strips float: prefix from numeric values', () => {
        expect(cleanParams({ ratio: 'float:0.5' })).toBe('{"ratio":0.5}');
    });

    it('handles mixed params', () => {
        expect(cleanParams({ name: 'game', score: 'int:500' })).toBe('{"name":"game","score":500}');
    });
});
