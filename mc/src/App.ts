import { ModesManager } from './managers/ModesManager.js'
import { BaseMode } from './modes/BaseMode.js'
import { GameMode } from './modes/GameMode.js'
import { AttractMode } from './modes/AttractMode.js'
import { DMD, ILayerDimensions } from './dmd/DMD.js'
import { DotShape } from './dmd/renderers/DMDRenderer.js'
import { ResourcesManager } from './managers/ResourcesManager.js'
import { VariablesManager } from './managers/VariablesManager.js'
import { AudioManager } from './managers/AudioManager.js'
import { WebSocketServer } from './network/WebSocketServer.js'
import { NoiseEffectRenderer } from './renderers/NoiseEffectRenderer.js'
import { Colors } from './dmd/Colors.js'
import { Utils } from './dmd/Utils.js'
import { Options } from './utils/Options.js'
import { CanvasLayer } from './dmd/layers/CanvasLayer.js'
import { ILayerRendererDictionary } from './dmd/renderers/LayerRenderer.js'


class App {
	private _dlgBox: HTMLDivElement
	private _wsServer: WebSocketServer
    private _dmd: DMD
    private _resourcesManager: ResourcesManager
    private _audioManager: AudioManager
    private _modesManager: ModesManager
    private _variablesManager: VariablesManager
    private _canvas: HTMLCanvasElement

    /**
     * 
     * @param {string} canvasId id of the canvas where the dmd will be rendered
     */
    constructor(canvasId: string) {
		this._wsServer = new WebSocketServer("archpinball.dev", 8443, true)
        this._resourcesManager = new ResourcesManager('/resources.json', '/resources/')
        this._audioManager = new AudioManager()
        this._modesManager = new ModesManager()
        this._variablesManager = new VariablesManager(['machine', 'player'])
        this._canvas = document.getElementById(canvasId) as HTMLCanvasElement

		// DefaultState for theses two variables
		this._variablesManager.set('player', 'players', [])
		this._variablesManager.set('player', 'player', 0)

		this._variablesManager.debug()
	}

	start() {
        var that = this

		// Create a new DMD where each pixel will be 5x5
		this._dmd = new DMD(this._canvas, 2, 1, 1, 1, DotShape.Square, 14, 0, true)

		window.DMDDisplay = this._dmd
		window.audioManager = this._audioManager

		// Build array of path to noise images
		/*var noises: string[] = []
		for (var i = 0 ; i < 6 ; i++) {
			noises.push(`resources/images/noises/noise-${i}.png`)
		}*/
		
		// Add score effect renderer instance to DMD
		//this._dmd.addRenderer('score-effect', new NoiseEffectRenderer(this._dmd.width, this._dmd.height, 200, noises))
	
		// HUD (to display connection/disconnection/errors)
		this._dlgBox = document.createElement('div')
        this._dlgBox.id = 'dialog-box' //CSS
        document.body.appendChild(this._dlgBox)

		// Load resources file then reset dmd
		this._resourcesManager.load().then(resources => {
			console.log("Resources file loaded")

			// Init DMD then
			that._dmd.init().then( device => {

				// Start rendering dmd
				that._dmd.run()

				// Reset the DMD (show only background layer and mpf logo)
				that._resetDMD(false)

				// Instantiate attract mode class
				var attractMode = new AttractMode(that._dmd, resources, that._variablesManager, that._audioManager)
				var gameMode = new GameMode(that._dmd, resources, that._variablesManager, that._audioManager)
				var baseMode = new BaseMode(that._dmd, resources, that._variablesManager, that._audioManager)

				// Init modes
				// TODO : Add modes here
				that._modesManager.add('attract', attractMode)
				that._modesManager.add('game', gameMode)
				that._modesManager.add('base', baseMode)

				// try to connect to socket server
				that._wsServer.onOpen = that._wsOnOpen.bind(that)
				that._wsServer.onClose = that._wsOnClose.bind(that)
				that._wsServer.onError = that._wsOnError.bind(that)
				that._wsServer.onMessage = that._wsOnMessage.bind(that)

				// Preload fonts then init mode and start websocket liaison
				//Utils.chainPromises(fonts).then(()=>{
				/*Promise.all(fonts)
				.then(() => {
					// Initialize added modes
					console.log('All fonts loaded')
					that._modes.initAll()
					that._wsServer.connect()
				})*/

				that._modesManager.initAll()
				that._wsServer.connect()
			})
		})
    }

	private _wsOnError(event: Event) {
		var that = this

		if (this._wsServer.isConnected()) {
			this._wsServer.close()
		} else {
			if ((event.target as WebSocket).readyState === 3) {
				setTimeout(function() {
					that._wsServer.connect()
				}, 1500)
			}
		}
	}

	private _wsOnOpen(event: Event) {
		var that = this

		this._showDlg("Connected...", 'success')

		setTimeout(function() {
			that._hideDlg()
		}, 1000)
	}

	private _wsOnClose(event: CloseEvent) {
		var that = this

		if (this._wsServer.isConnected()) {
			//console.log("WebSocket onclose", event)

			this._reset()

			this._showDlg("Connection lost ...", 'error')

			setTimeout(function() {
				that._wsServer.connect()
			}, 1000)
		}
	}

	/**
	 * Handle messages from web socket server
	 * @param {event} ev 
	 */
	private _wsOnMessage(cmd: string, _params: {}, rawData: any) { // TODO : Check any
		const params = new Options(_params)

		//console.log(`_wsOnMessage()[${cmd}] :`, params)

		switch(cmd) {
			case 'mc_connected':
				console.log("MPF connected")
				break
			case 'mc_hello':
				console.log("MPF says hello")
				break
			case 'mc_reset':
				console.log("MPF requested reset")

				this._dmd.fadeOut(150).then(() => {
					this._dmd.removeLayer("logo")
					this._wsServer.send('mc_ready')
				})

				break
			case 'mc_machine_variable':
				this._updateMachineVariables(params)
				break
			case 'mc_mode_start':
				this._modesManager.startMode(
					params.get('name'),
					parseInt(params.get('priority'))
				)
				break
			case 'mc_mode_stop':
				this._modesManager.stopMode(params.get('name'))
				break
			case 'mc_player_added':
				this._addPlayer()
				break
			case 'mc_player_turn_start':
				this._playerTurnStart(
					parseInt(params.get('player_num'))
				)
				break
			case 'mc_ball_start':
				this._ballStart(
					parseInt(params.get('player_num')),
					parseInt(params.get('ball'))
				)
				break
			case 'mc_ball_end':
				console.log('ball_end')
				// todo ?
				break
			case 'mc_player_variable':
				this._updatePlayerVariable(new Options(JSON.parse(params.get('variables'))))
				break
			case 'mc_goodbye':
				console.log("MPF said goodbye")
				this._reset()
				break
			default:
				console.log("Unhandled message received : ", rawData)
		}
	}

	
    /**
     * Hide system dialog box
     */
	 private _hideDlg() {
		this._dlgBox.className = ''
		this._dlgBox.innerHTML = ''
	}

    /**
     * Show system dialog box
     */
	private _showDlg(txt: string, classTxt: string) {
		this._dlgBox.className = 'dlg-' + classTxt
		this._dlgBox.innerHTML = txt
	}


    /**
     * Reset app
     */
	private _reset() {
		this._modesManager.stopActiveMode()
		this._resetDMD(true)
		this._audioManager.reset()
	}

	/**
	 * Reset all layers and add the two default layers
	 */
	private _resetDMD(initModes: boolean = false) {
		console.log("DMD reset")

		this._audioManager.reset()

		var that = this

		// Remove all layers
		this._dmd.reset()

		// Add default screen (mpf logo)
		this._dmd.createCanvasLayer(
			'logo',
			{}, // use default values
			new Options({ opacity : 1 }),
			null,
			(layer : CanvasLayer) => {
				that._resourcesManager
				.getImage('logo').load()
				.then( bitmap => {
					layer.drawBitmap(
					bitmap,
					new Options({
						top: 0,
						left: 0,
						width: '100%', // Number of horizontal DMD dots 
						height: '100%' // Number of vertical DMD dots
					})
					)
				})
				.catch(error => alert(error))
			})

		if (!!initModes) {
			// Init modes
			this._modesManager.initAll()
		}
	
		// DMD has been created with brightness = 0 so show it now
		setTimeout(this._fadeIn.bind(this), 100)
	}

	/**
	 * Fade DMD from {current brightness} to 1
	 */
	private _fadeIn() {
		this._dmd.fadeIn(800)
	}

	/**
	 * Update ball number for playerNum
	 * @param {number} playerNum 
	 * @param {number} ball 
	 */
	private _ballStart(playerNum: number, ball: number) {
		var players = this._variablesManager.get('player', 'players', [])
		var newBallNumber = ball
		var currentBallNumber = parseInt(players[playerNum - 1].ball)

		if (newBallNumber !== currentBallNumber) {
			console.log(`Ball [${newBallNumber}] start for player [${playerNum}]`)
			players[playerNum - 1].ball = newBallNumber
			this._variablesManager.set('player', 'players', players)
		}
	}

	/**
	 * Update player variable (score,ball, etc)
	 * @param {Options} data 
	 */
	private _updatePlayerVariable(data: Options) {
		const playerNum = data.get('player_num') - 1 // Player 1 = index 0

		let players = this._variablesManager.get('player', 'players', [])

		if (typeof players[playerNum] !== 'undefined') {
			players[playerNum][data.get('name')] = parseInt(data.get('value'))

			this._variablesManager.set('player', 'players', players)
		} else {
			console.log("Player num is wrong", data)
		}
	}

	/**
	 * Update multiple machine variables at a time
	 * @param {Options} params 
	 */
	private _updateMachineVariables(params: Options) {
		for (const [key, value] of Object.entries(params)) {
			let v

			try {
				v = JSON.parse(value)
			} catch (error) {
				v = value
			}
			
			this._variablesManager.set('machine', key, v)
		}
	}

	private _addPlayer() {
		console.log('Player added')
		const currentPlayer = this._variablesManager.get('player', 'player', 0)

		var players = this._variablesManager.get('player', 'players', [])
		players.push({ball : 1, score : 0})

		// Special case for 1 player game
		if (currentPlayer === 0 && players.length === 1) {
			this._playerTurnStart(1)
		}

		this._variablesManager.set('player', 'players', players)
	}

	private _playerTurnStart(playerNum: number) {
		console.log(`Player turn Start : ${playerNum}`)

		this._variablesManager.set('player', 'player', playerNum)
	}
}

export { App }