export interface ParsedMessage {
    command: string;
    params: Record<string, string>;
}

export function parseMessageData(message: string): ParsedMessage {
    const parts = message.split('?');
    let cmd = message;
    let params: Record<string, string> = {};

    if (parts.length > 1) {
        const urlSearchParams = new URLSearchParams(parts[1]);
        params = Object.fromEntries(urlSearchParams.entries());
        cmd = parts[0];
    }

    return { command: cmd, params };
}

export function str2int(str: string): number {
    return parseInt(str.replace('int:', ''), 10);
}

export function str2value(str: string): string | number {
    if (!str) {
        return '';
    }
    if (str.startsWith('int:')) {
        return parseInt(str.replace('int:', ''), 10);
    }
    if (str.startsWith('float:')) {
        return parseFloat(str.replace('float:', ''));
    }
    return str;
}

export function cleanParams(obj: Record<string, unknown>): string {
    return JSON.stringify(obj).replace(/"(int|float):([\d.]+)"/gi, '$2');
}
