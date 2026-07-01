import fs from 'fs';

export interface KeyboardKey {
    switch: string;
    state: boolean;
    toggle: boolean;
}

export class Keyboard {
    readonly keys: Record<string, KeyboardKey> = {};

    constructor(configPath: string) {
        try {
            const fileContents = fs.readFileSync(configPath, 'utf8');
            const data = JSON.parse(fileContents) as Record<string, KeyboardKey>;

            if (typeof data === 'object') {
                Object.keys(data).forEach(k => {
                    const sw = data[k];
                    sw.state = (sw.switch === 's_plunger'); // Tmp hack to force plunger state to true
                    sw.toggle = sw.toggle || false;
                    this.keys[k] = sw;
                });
            }
        } catch (e) {
            console.error(e);
        }
    }

    onKeyPressed(key: string, bcpSend: (msg: string) => void): void {
        //console.log(`Key pressed => ${key}`);
        if (typeof this.keys[key] === 'object') {
            if (this.keys[key].toggle === true) {
                this.keys[key].state = !this.keys[key].state;
                const state = this.keys[key].state ? 1 : 0;
                bcpSend(`switch?name=${this.keys[key].switch}&state=${state}`);
            } else {
                bcpSend(`switch?name=${this.keys[key].switch}&state=1`);
                bcpSend(`switch?name=${this.keys[key].switch}&state=0`);
            }
        } else {
            console.log(`Unhandled key pressed => ${key}`);
        }
    }

    resetToggleStates(): void {
        Object.entries(this.keys)
            .filter(([, obj]) => obj.toggle)
            .forEach(([key]) => { this.keys[key].state = false; });
    }
}
