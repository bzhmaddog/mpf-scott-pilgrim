import { Modes } from './modes/Modes.mjs';
import { BaseMode } from './modes/BaseMode.mjs';
import { AttractMode } from './modes/AttractMode.mjs';
import { DMD } from './dmd/DMD.mjs';
import { Fonts } from './fonts/Fonts.mjs';
import { Resources } from './resources/Resources.mjs';
import { Variables } from './variables/Variables.mjs';
import { AudioManager } from './audio-manager/AudioManager.mjs';
import { WSS } from './ws/WSS.mjs';
import { Utils } from './utils/Utils.mjs';
import { Sprite } from './dmd/Sprite.mjs';
import { ScoreEffectGPURenderer } from './dmd/renderers/ScoreEffectGPURenderer.mjs';
import { Colors } from './dmd/Colors.mjs';

class App {
	#dlgBox;
	#wsServer;
    #dmd;
    #resources;
    #audioManager;
    #fonts;
    #modes;
    #variables;
    #canvas;
	#dmdWidth;
	#dmdHeight;
	#screenWidth;
	#screenHeight;

    /**
     * 
     * @param {string} canvasId id of the canvas where the dmd will be rendered
     */
    constructor(canvasId) {
        this.#dlgBox;
        this.#wsServer = new WSS(location.hostname, 1337);
        this.#dmd;
        this.#resources = new Resources('/res/resources.json');
        this.#audioManager = new AudioManager();
        this.#fonts;
        this.#modes = new Modes();
        this.#variables = new Variables(['machine', 'player']);
        this.#canvas = document.getElementById(canvasId);
        this.#fonts = new Fonts();

		this.#dmdWidth = 256;
		this.#dmdHeight = 78;
		this.#screenWidth = 1280;
		this.#screenHeight = 390;


		this.#variables.set('player', 'players', []);
		this.#variables.set('player', 'player', 0);

		window.getMPFVars = function() {
			return this.#variables;
		}.bind(this);
    }

    start() {
        var that = this;
        // Create a new DMD where each pixel will be 5x5
		// pixels will be spaced by 3 pixels horizontaly and verticaly
		// the original medias size will be 128x64
		// and the final DMD size will be 1024x511
		// pixel shape will be circle (can be circle or square at the moment)
		this.#dmd = new DMD(this.#dmdWidth, this.#dmdHeight, this.#screenWidth, this.#screenHeight, 4, 4, 1, 1, 1, 1, DMD.DotShape.Square, 14, this.#canvas);
		
		// dmd without dot effect
		//dmd = new DMD(1280, 390, 1280, 390, 1, 1, 0, 0, 0, 0, 'square', document.getElementById('dmd'));

		this.#dlgBox = document.createElement('div');
        this.#dlgBox.id = 'dialog-box';
        document.body.appendChild(this.#dlgBox);

		/*PubSub.subscribe('layer.created', function(ev, layer) {
			logger.log(`Layer created : ${layer.getId()}`, layer);
		});*/


		/*PubSub.subscribe('layer.loaded', function(ev, layer) {
			logger.log(`Layer loaded : ${layer.getId()}`, layer);
		});*/

		// Load resources file then reset dmd
		this.#resources.load().then(function(resources) {
			logger.log("Resources file loaded", resources);


			// Start rendering frames
			that.#dmd.run();

			// Reset the DMD (show only background layer and mpf logo)
			that.#resetDMD();

			// Preload some musics/sounds
			resources.getMusics().filter(music => music.preload === true).forEach( music => {
				that.#audioManager.loadSound(music.url, music.key);
			});

			resources.getSounds().filter(sound => sound.preload === true).forEach( sound => {
				that.#audioManager.loadSound(sound.url, sound.key);
			});

			// Preload fonts
			that.#resources.getFonts().forEach(f => {
				that.#fonts.add(f.key, f.name, f.url).load().then(function() {
					logger.log(`Font '${f.name}' loaded`);
				});
			});

            // Instantiate attract mode class
            var attractMode = new AttractMode(that.#dmd, resources, that.#fonts, that.#variables, that.#audioManager);
			var baseMode = new BaseMode(that.#dmd, resources, that.#fonts, that.#variables, that.#audioManager);

            // Init modes
            // TODO : Add modes here
			that.#modes.add('attract', attractMode);
			that.#modes.add('game', baseMode);

			// Initialize added modes
			that.#modes.initAll();
	
            // try to connect to socket server
			that.#wsServer.onOpen = that.#wsOnOpen.bind(that);
			that.#wsServer.onClose = that.#wsOnClose.bind(that);
			that.#wsServer.onError = that.#wsOnError.bind(that);
			that.#wsServer.onMessage = that.#wsOnMessage.bind(that);
			that.#wsServer.connect();

		});		
    }

	#wsOnError(event) {
		var that = this;
		//logger.log("WebSocket onerror", event);

		if (this.#wsServer.isConnected()) {
			this.#wsServer.close();
		} else {
			if (event.target.readyState === 3) {
				setTimeout(function() {
					that.#wsServer.connect();
				}, 1500);
			}
		}		
	}

	#wsOnOpen(event) {
		var that = this;
		//logger.log("WebSocket onconnect", event);
		this.#showDlg("Connected...", 'success');
		setTimeout(function() {
			that.#hideDlg();
		}, 1000);
	}

	#wsOnClose(event) {
		var that = this;

		if (this.#wsServer.isConnected()) {
			//logger.log("WebSocket onclose", event);

			this.#reset();

			this.#showDlg("Connection lost ...", 'error');
			setTimeout(function() {
				that.#wsServer.connect();
			}, 1000);
		}
	}

	/**
	 * Handle messages from web socket server
	 * @param {event} ev 
	 */
	#wsOnMessage(cmd, params, rawData) {

		//console.log(arguments);

		switch(cmd) {
			case 'mc_connected':
				logger.log("MPF connected");
				break;
			case 'mc_hello':
				logger.log("MPF says hello");
				break;
			case 'mc_reset':
				logger.log("MPF requested reset");
				this.#dmd.removeLayer("logo");
				this.#wsServer.send('mc_ready');
				break;
			case 'mc_machine_variable':
				for (const [key, value] of Object.entries(params)) {
					var v;

					try {
						v = JSON.parse(value);
					} catch (error) {
						v = value;
					}
					
					this.#variables.set('machine', key, v);
				};
				break;
			case 'mc_mode_start':
				this.#modes.startMode(params.name, params.priority);
				break;
			case 'mc_mode_stop':
				this.#modes.stopMode(params.name);
				break;
			case 'mc_player_added':
				var players = this.#variables.get('player', 'players', []);
				players.push({ball : 1, score : 0});
				this.#variables.set('player', 'players', players);
				//logger.log(this.#variables.get('player', 'players', {}));
				break;
			case 'mc_player_turn_start':
				this.#variables.set('player', 'player', parseInt(params.player_num, 10));
				break;
			case 'mc_ball_start':
				var players = this.#variables.get('player', 'players', []);
				var newBallNumber = parseInt(params.ball, 10);
				var currentBallNumber = players[params.player_num - 1].ball;

				if (newBallNumber !== currentBallNumber) {
					logger.log(`New ball for player ${params.player_num}`);
					players[params.player_num - 1].ball = newBallNumber;
					//logger.log("players", players);
					this.#variables.set('player', 'players', players);
				}
				break;
			case 'mc_ball_end':
				logger.log('ball_end');
				break;
			case 'mc_goodbye':
				logger.log("MPF said goodbye");
				this.#reset();
				break;
			default:
				logger.log("Unhandled message received : ", data);

		}
	}

	
    /**
     * Hide system dialog box
     */
	 #hideDlg() {
		this.#dlgBox.className = '';
		this.#dlgBox.innerHTML = '';
	}

    /**
     * Show system dialog box
     */
	#showDlg(txt, classTxt) {
		this.#dlgBox.className = 'dlg-' + classTxt;
		this.#dlgBox.innerHTML = txt;
	}


    /**
     * Reset app
     */
	#reset() {
		this.#modes.stopActiveMode();
		this.#resetDMD();
		this.#audioManager.reset();
	}

	/**
	 * Reset all layers and add the two default layers
	 */
	#resetDMD() {
		logger.log("DMD reset");
		this.#dmd.reset();

		this.#dmd.addLayer({
			name :'logo',
			type : 'image',
			src : 'images/logo.webp',
			mimeType : 'image/webp',
			visible : true
		});

		const hudLayer = this.#dmd.addLayer({
			name : 'hud',
			type : 'text',
			zIndex : 1000,
			visible : false
		});			


		const scoreRenderer = new ScoreEffectGPURenderer(this.#dmdWidth, this.#dmdHeight);

		scoreRenderer.init().then(device => {

			const scoreLayer = this.#dmd.addLayer({
				name : 'score',
				type : 'text',
				zIndex : 1001,
				visible : false,
				renderer : scoreRenderer
			});	
	
			scoreLayer.content.addText('score', 0, {
				fontSize : '40',
				fontFamily : 'Dusty',
				align : 'right',
				xOffset : -1,
				vAlign : 'middle',
				color : Colors.white,
				strokeWidth : 2,
				strokeColor : Colors.blue,
				adjustWidth : true
			});				
		
		});

	
		
		hudLayer.content.addText('ball-text', this.#resources.getString('ballText'), {
			fontSize : '10',
			fontFamily : 'Dusty',
			align : 'right',
			xOffset : -11,
			vAlign : 'bottom',
			yOffset : -1,
			color : Colors.white,
			strokeWidth : 2,
			strokeColor : Colors.blue
		});

		hudLayer.content.addText('ball-value', 1, {
			fontSize : '10',
			fontFamily : 'Dusty',
			align : 'right',
			xOffset : -1,
			vAlign : 'bottom',
			yOffset : -1,
			color : Colors.white,
			strokeWidth : 2,
			strokeColor : Colors.blue
		});

		hudLayer.content.addText('player-text', Utils.format(this.#resources.getString('playerText'),"") + " :", {
			fontSize : '10',
			fontFamily : 'Dusty',
			left : 2,
			vAlign : 'bottom',
			yOffset : -1,
			color : Colors.white,
			strokeWidth : 2,
			strokeColor : Colors.blue
		});

		hudLayer.content.addText('player-value', 1, {
			fontSize : '10',
			fontFamily : 'Dusty',
			left : 61,
			vAlign : 'bottom',
			yOffset : -1,
			color : Colors.white,
			strokeWidth : 2,
			strokeColor : Colors.blue
		});

	


		/*const scoreRenderer = new ScoreEffectGPURenderer(this.#dmdWidth, this.#dmdHeight);

		scoreRenderer.init().then(device => {

			const testLayer = this.#dmd.addLayer({
				name : 'test',
				type : 'text',
				visible : true,
				renderer : scoreRenderer
			});	
	
			testLayer.content.addText('score', Utils.formatScore(98765403210), {
				fontSize : '40',
				fontFamily : 'Dusty',
				align : 'right',
				vAlign : 'middle',
				xOffset : -1,
				color : Colors.white,
				strokeWidth : 1,
				strokeColor : Colors.blue,
				adjustWidth : true
			});			
		});*/

		this.#modes.initAll();
	}
}

export { App };