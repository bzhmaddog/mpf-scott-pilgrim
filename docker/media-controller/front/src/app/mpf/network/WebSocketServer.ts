import {WebSocketMessageParams} from "@mpf/types";

export interface IWebSocketServerConfig {
  hostname: string,
  port: number,
  path?: string,
  secure?: boolean,
  onMessage: (cmd: string, _params: WebSocketMessageParams, rawData: unknown) => void
  onOpen?: (event: Event) => void
  onClose?: (event: CloseEvent) => void
  onError?: (event: Event) => void
}


/**
 * Message handler : Parse the message received by the server and publish events to be captured by the client
 * @param s {Object} a WebSocket connection
 */
export class WebSocketServer {
  private _server?: WebSocket
  private _isConnected: boolean
  private readonly _port: number
  private readonly _hostname: string
  private readonly _onOpenListener?: (event: Event) => void
  private readonly _onCloseListener?: (event: CloseEvent) => void
  private readonly _onErrorListener?: (event: Event) => void
  private readonly _onMessageListener: (cmd: string, _params: WebSocketMessageParams, rawData: unknown) => void
  private readonly _path: string
  private readonly _isSecure: boolean

  constructor(config: IWebSocketServerConfig) {
    this._isConnected = false
    this._hostname = config.hostname
    this._port = config.port
    this._path = config.path ?? ''
    this._isSecure = config.secure ?? false

    this._onMessageListener = config.onMessage

    if (config.onOpen) {
      this._onOpenListener = config.onOpen
    }

    if (config.onClose) {
      this._onCloseListener = config.onClose
    }

    if (config.onError) {
      this._onErrorListener = config.onError
    }

  }

  /**
   * Internal on error handle (forward to listener)
   * @param event
   */
  private _onError(event: Event) {
    this._onErrorListener?.(event)
  }

  /**
   * Internal onopen handle to manage the state of isConnected
   * @param event
   */
  private _onOpen(event: Event) {
    this._isConnected = true
    this._onOpenListener?.(event)
  }

  /**
   * Internal message handle (forward event to listener only if connected to server)
   * @param event
   */
  private _onMessage(event: MessageEvent) {
    if (this._isConnected) {
      // Parse message into a command and params
      const data = event.data
      const parts = data.split('?')
      let cmd = ""
      let params = {}

      if (parts.length > 1) {
        const urlSearchParams = new URLSearchParams(parts[1])
        params = Object.fromEntries(urlSearchParams.entries())
        cmd = parts[0]
      } else {
        cmd = data
      }

      this._onMessageListener(cmd, params, data)
    }
  }

  /**
   * Internal close event (to manage isConnected state)
   * @param event
   */
  private _onClose(event: CloseEvent) {
    this._isConnected = false
    this._onCloseListener?.(event)
  }

  /**
   * Connect to websocket server
   */
  connect() {
    const protocol = this._isSecure ? 'wss': 'ws'
    this._server = new WebSocket(`${protocol}://${this._hostname}:${this._port}${this._path}`, ['soap', 'xmpp'])

    this._server.onerror = this._onError.bind(this)
    this._server.onopen = this._onOpen.bind(this)
    this._server.onclose = this._onClose.bind(this)
    this._server.onmessage = this._onMessage.bind(this)
  }

  /**
   * Close websocket server
   */
  close() {
    this._server?.close()
  }

  /**
   * Send a message to the server
   * @param data {string} Data to send in the message
   */
  send(data: string) {
    this._server?.send(data)
  }

  isConnected() {
    return this._isConnected
  }
}
