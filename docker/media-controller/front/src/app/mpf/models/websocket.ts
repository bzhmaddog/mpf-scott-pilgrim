export type WebSocketMessageParams = {
    [key: string]: string
}

export interface IWebSocketServerConfig {
    hostname: string
    port: number
    path?: string
    secure?: boolean
    onMessage: (cmd: string, params: WebSocketMessageParams, rawData: unknown) => void
    onOpen?: (event: Event) => void
    onClose?: (event: CloseEvent) => void
    onError?: (event: Event) => void
}
