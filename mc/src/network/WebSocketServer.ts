/**
 * Message handler : Parse the message received by the server and publish events to be captured by the client
 * @param s {Object} a WebSocket connection
 */
class WebSocketServer {
	private _server: WebSocket
	private _isConnected: boolean
	private _port: number
	private _hostname: string
	private _onOpenListener?: Function
	private _onCloseListener?: Function
	private _onErrorListener?: Function
	private _onMessageListener?: Function
	private _isSecure

	constructor(hostname: string, port: number, secure: boolean) {
		this._isConnected = false
		this._hostname = hostname
		this._port = port
		this._isSecure = !!secure
	}

	set onOpen(listener: Function) {
		this._onOpenListener = listener
	}

	set onClose(listener: Function) {
		this._onCloseListener = listener
	}

	set onError(listener: Function) {
		this._onErrorListener = listener
	}

	set onMessage(listener: Function) {
		this._onMessageListener = listener
	}

	/**
	 * Internal on error handle (forward to listener)
	 * @param event 
	 */
	private _onError(event: Event) {
		if (typeof this._onErrorListener === 'function') {
			this._onErrorListener(event)
		}
	}

	/**
	 * Internal onopen handle to manage the state of isConnected
	 * @param event 
	 */
	private _onOpen(event: Event) {
		this._isConnected = true
		
		if (typeof this._onOpenListener === 'function') {
			this._onOpenListener(event)
		}
	}

	/**
	 * Internal message handle (forward event to listener only if connected to server)
	 * @param event 
	 */
	private _onMessage(event: MessageEvent) {
		if (this._isConnected && typeof this._onMessageListener === 'function') {

			// Parse message into a command and params
			let data = event.data
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

			//console.log(cmd)
	
			this._onMessageListener(cmd, params, data)
		}
	}

	/**
	 * Internal close event (to manage isConnected state)
	 * @param event
	 */
	private _onClose(event: CloseEvent) {
		if (typeof this._onCloseListener === 'function') {
			this._onCloseListener(event)
		}
		this._isConnected = false
	}

	/**
     * Connect to websocket server
     */
	connect() {
		let protocol

		if (this._isSecure) {
			protocol = 'wss'
		} else {
			protocol = `ws`
		}


		// Connect to the server via a websocket
		this._server = new WebSocket( `${protocol}://${this._hostname}:${this._port}`, ['soap', 'xmpp'])

		this._server.onerror = this._onError.bind(this)
		this._server.onopen = this._onOpen.bind(this)
		this._server.onclose = this._onClose.bind(this)
		this._server.onmessage = this._onMessage.bind(this)
	}

	/**
	 * Close websocket server
	 */
	close() {
		this._server.close()
	}

	/**
	 * Send a message to the server
	 * @param data {string} Data to send in the message
	 */
	send(data: string) {
		this._server.send(data)
	}

	isConnected() {
		return this._isConnected
	}
}

export { WebSocketServer }