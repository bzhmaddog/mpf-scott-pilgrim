import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import { Keyboard } from '../src/keyboard';

const CONFIG = JSON.stringify({
  a: { switch: 's_left_flipper', toggle: false },
  b: { switch: 's_select', toggle: true },
  c: { switch: 's_plunger' },
});

describe('Keyboard', () => {
    let kb: Keyboard;

    beforeEach(() => {
        vi.spyOn(fs, 'readFileSync').mockReturnValue(CONFIG);
        kb = new Keyboard('dummy.json');
    });

    it('loads keys from config', () => {
        expect(Object.keys(kb.keys)).toEqual(['a', 'b', 'c']);
        expect(kb.keys['a'].toggle).toBe(false);
        expect(kb.keys['b'].toggle).toBe(true);
    });

    it('forces plunger state to true on load', () => {
        expect(kb.keys['c'].state).toBe(true);
    });

    it('sends press and release for non-toggle keys', () => {
        const sent: string[] = [];
        kb.onKeyPressed('a', (m) => sent.push(m));
        expect(sent).toEqual([
            'switch?name=s_left_flipper&state=1',
            'switch?name=s_left_flipper&state=0',
        ]);
    });

    it('flips state for toggle keys', () => {
        const sent: string[] = [];
        kb.onKeyPressed('b', (m) => sent.push(m));
        kb.onKeyPressed('b', (m) => sent.push(m));
        expect(sent).toEqual([
            'switch?name=s_select&state=1',
            'switch?name=s_select&state=0',
        ]);
    });

    it('ignores unknown keys', () => {
        const sent: string[] = [];
        kb.onKeyPressed('z', (m) => sent.push(m));
        expect(sent).toHaveLength(0);
    });

    it('resets toggle states to false', () => {
        kb.onKeyPressed('b', () => {});
        expect(kb.keys['b'].state).toBe(true);
        kb.resetToggleStates();
        expect(kb.keys['b'].state).toBe(false);
    });

    it('handles missing config gracefully', () => {
        vi.spyOn(fs, 'readFileSync').mockImplementation(() => { throw new Error('nope'); });
        const empty = new Keyboard('missing.json');
        expect(Object.keys(empty.keys)).toHaveLength(0);
    });
});
