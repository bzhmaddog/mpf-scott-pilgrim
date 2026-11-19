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
    return Number.parseInt(str.replace('int:', ''), 10);
}

export function str2value(str: string): string | number {
    if (!str) {
        return '';
    }
    if (str.startsWith('int:')) {
        return Number.parseInt(str.replace('int:', ''), 10);
    }
    if (str.startsWith('float:')) {
        return Number.parseFloat(str.replace('float:', ''));
    }
    return str;
}

export function cleanParams(obj: Record<string, unknown>): string {
    return JSON.stringify(obj).replace(/"(int|float):([\d.]+)"/gi, '$2');
}

/**
 * Make an untrusted value safe to write to logs: serialize it and escape
 * CR/LF so it cannot forge additional log lines (log injection).
 */
export function sanitizeForLog(value: unknown): string {
    const text = typeof value === 'string' ? value : JSON.stringify(value) ?? String(value);
    return text.replaceAll('\r', String.raw`\r`).replaceAll('\n', String.raw`\n`);
}
