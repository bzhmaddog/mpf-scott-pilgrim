import { Modes } from './modes/Modes.mjs';
import { BaseMode } from './modes/BaseMode.mjs';
import { GameMode } from './modes/GameMode.mjs';
import { AttractMode } from './modes/AttractMode.mjs';
import { DMD } from './dmd/DMD.mjs';
import { Fonts } from './fonts/Fonts.mjs';
import { Resources } from './resources/Resources.mjs';
import { Variables } from './variables/Variables.mjs';
import { AudioManager } from './audio-manager/AudioManager.mjs';
import { WSS } from './ws/WSS.mjs';
import { ScoreEffectRenderer } from './renderers/ScoreEffectRenderer.mjs';
import { Colors } from './dmd/Colors.mjs';
import { Utils } from './dmd/Utils.mjs';

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
        this.#resources = new Resources('/resources.json', '/resources/');
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
		this.#dmd = new DMD(this.#dmdWidth, this.#dmdHeight, this.#screenWidth, this.#screenHeight, 4, 4, 1, 1, 1, 1, DMD.DotShape.Square, 14, 0, this.#canvas, true);
		

		var noises = [];
		for (var i = 0 ; i < 24 ; i++) {
			noises.push(`resources/animations/noises/medium/noise-${i}.png`);
		}

		
		this.#dmd.addRenderer('score-effect', new ScoreEffectRenderer(this.#dmdWidth, this.#dmdHeight, noises));
		//this.#dmd.addRenderer('no-antialiasing', new RemoveAliasingRenderer(this.#dmdWidth, this.#dmdHeight));
		//this.#dmd.addRenderer('outline', new OutlineRenderer(this.#dmdWidth, this.#dmdHeight));

		//this.#dmd.addRenderer('dummy', new DummyRenderer(this.#dmdWidth, this.#dmdHeight));
		

		this.#dlgBox = document.createElement('div');
        this.#dlgBox.id = 'dialog-box';
        document.body.appendChild(this.#dlgBox);

		/*PubSub.subscribe('layer.created', function(ev, layer) {
			console.log(`Layer created : ${layer.getId()}`, layer);
		});*/


		/*PubSub.subscribe('layer.loaded', function(ev, layer) {
			console.log(`Layer loaded : ${layer.getId()}`, layer);
		});*/

		// Load resources file then reset dmd
		this.#resources.load().then(function(resources) {
			console.log("Resources file loaded", resources);


			// Init DMD then
			that.#dmd.init().then( () => {

				// Start rendering dmd
				that.#dmd.run();

				// Reset the DMD (show only background layer and mpf logo)
				that.#resetDMD(false);

				// Preload some musics/sounds
				resources.getMusics().filter(music => music.preload === true).forEach( music => {
					that.#audioManager.loadSound(music.url, music.key);
				});

				resources.getSounds().filter(sound => sound.preload === true).forEach( sound => {
					that.#audioManager.loadSound(sound.url, sound.key);
				});

				// Prepare fonts to be loaded
				var fonts = [];
				that.#resources.getFonts().forEach(f => {
					fonts.push(that.#fonts.add(f.key, f.name, f.url).load());
				});

				// Instantiate attract mode class
				var attractMode = new AttractMode(that.#dmd, resources, that.#fonts, that.#variables, that.#audioManager);
				var gameMode = new GameMode(that.#dmd, resources, that.#fonts, that.#variables, that.#audioManager);
				var baseMode = new BaseMode(that.#dmd, resources, that.#fonts, that.#variables, that.#audioManager);

				// Init modes
				// TODO : Add modes here
				that.#modes.add('attract', attractMode);
				that.#modes.add('game', gameMode);
				that.#modes.add('base', baseMode);

				// try to connect to socket server
				that.#wsServer.onOpen = that.#wsOnOpen.bind(that);
				that.#wsServer.onClose = that.#wsOnClose.bind(that);
				that.#wsServer.onError = that.#wsOnError.bind(that);
				that.#wsServer.onMessage = that.#wsOnMessage.bind(that);

				// Preload fonts then init mode and start websocket liaison
				Utils.chainPromises(fonts).then(()=>{
					// Initialize added modes
					console.log('All fonts loaded');

					that.#modes.initAll();
			
					that.#wsServer.connect();				
				});
			});
		});		
    }

	#wsOnError(event) {
		var that = this;
		//console.log("WebSocket onerror", event);

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
		//console.log("WebSocket onconnect", event);
		this.#showDlg("Connected...", 'success');
		setTimeout(function() {
			that.#hideDlg();
		}, 1000);
	}

	#wsOnClose(event) {
		var that = this;

		if (this.#wsServer.isConnected()) {
			//console.log("WebSocket onclose", event);

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

		var that = this;

		switch(cmd) {
			case 'mc_connected':
				console.log("MPF connected");
				break;
			case 'mc_hello':
				console.log("MPF says hello");
				break;
			case 'mc_reset':
				console.log("MPF requested reset");

				this.#dmd.fadeOut(150).then(() => {
					this.#dmd.removeLayer("logo");
					this.#wsServer.send('mc_ready');
				});

				break;
			case 'mc_machine_variable':
				this.#updateMachineVariables(params);
				break;
			case 'mc_mode_start':
				this.#modes.startMode(params.name, params.priority);
				break;
			case 'mc_mode_stop':
				this.#modes.stopMode(params.name);
				break;
			case 'mc_player_added':
				this.#addPlayer();
				break;
			case 'mc_player_turn_start':
				this.#playerTurnStart(params.player_num);
				break;
			case 'mc_ball_start':
				this.#ballStart(params.player_num, params.ball);
				break;
			case 'mc_ball_end':
				console.log('ball_end');
				// todo ?
				break;
			case 'mc_player_variable':
				console.log(params);
				this.#updatePlayerVariable(JSON.parse(params.variables));
				break;
			case 'mc_goodbye':
				console.log("MPF said goodbye");
				this.#reset();
				break;
			default:
				console.log("Unhandled message received : ", rawData);

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
		this.#resetDMD(true);
		this.#audioManager.reset();
	}

	/**
	 * Reset all layers and add the two default layers
	 */
	#resetDMD(initModes) {
		console.log("DMD reset");

		var that = this;

		// Remove all layers
		this.#dmd.reset();

		// Add default screen (mpf logo)
		this.#dmd.addLayer(DMD.LayerType.Image, 'logo', {
			src : this.#resources.getImage('logo'),
			//src : '/resources/tests/white.png'
			//visible : false
			//opacity : 0.5
		});

		if (!!initModes) {
			// Init modes
			this.#modes.initAll();
		}

		/*var testLayer = this.#dmd.addLayer(DMD.LayerType.Image,'test',{
			src : 'resources/animations/boss-mode/0.webp',
			opacity : 0.5,
			//renderers : ['score-effect']
		});*/

        /*var testLayer = this.#dmd.addLayer(DMD.LayerType.Text, 'test', {
			text : "GAME OVER",
            fontSize: '20',
            fontFamily : 'Dusty',
            align : 'center',
            top: 1,
			//letterSpacing : 40,
            outlineWidth : 1,
            outlineColor : Colors.red,
            antialiasing : false,
			aaTreshold : 144,
			//visible : false
            //renderers : ['score-effect'],
			opacity : 0.5
        });*/



		//document.getElementById('slider').addEventListener('change', function(){
		//	console.log(this.value);
		//	var l = that.#dmd.getLayer('test');

			//l.setOpacity(this.value / 255);

			//l.setRendererParams('no-antialiasing',[this.value]);
			//l.redraw();
		//});

		//setTimeout(function(){
			//that.#dmd.showLayerGroup('hud');
			//that.#dmd.showLayer('gameover-text');
		//}, 200);

		
		// DMD has been created with brightness = 0 so show it now
		setTimeout(this.#fadeIn.bind(this), 100);
	}

	/**
	 * Fade DMD from {current brightness} to 1
	 */
	#fadeIn() {
		this.#dmd.fadeIn(150);		
	}

	/**
	 * Update ball number for playerNum
	 * @param {number} playerNum 
	 * @param {number} ball 
	 */
	#ballStart(playerNum, ball) {
		var players = this.#variables.get('player', 'players', []);
		var newBallNumber = parseInt(ball, 10);
		var currentBallNumber = players[playerNum - 1].ball;

		if (newBallNumber !== currentBallNumber) {
			console.log(`Ball [${newBallNumber}] start for player [${playerNum}]`);
			players[playerNum - 1].ball = newBallNumber;
			this.#variables.set('player', 'players', players);
		}
	}

	/**
	 * Update player variable (score,ball, etc)
	 * @param {object} data 
	 */
	#updatePlayerVariable(data) {
		const playerNum = data.player_num - 1;

		let players = this.#variables.get('player', 'players', []);
		if (typeof players[playerNum] !== 'undefined') {
			players[playerNum][data.name] = data.value;
			this.#variables.set('player', 'players', players);				
		} else {
			console.log("Player num is wrong", data);
		}		
	}

	/**
	 * Update multiple machine variables at a time
	 * @param {object} params 
	 */
	#updateMachineVariables(params) {
		for (const [key, value] of Object.entries(params)) {
			let v;

			try {
				v = JSON.parse(value);
			} catch (error) {
				v = value;
			}
			
			this.#variables.set('machine', key, v);
		};
	}

	#addPlayer() {
		var players = this.#variables.get('player', 'players', []);
		players.push({ball : 1, score : 0});
		this.#variables.set('player', 'players', players);
	}

	#playerTurnStart(playerNum) {
		this.#variables.set('player', 'player', parseInt(playerNum, 10));		
	}
}

export { App };