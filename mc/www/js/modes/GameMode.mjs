import { Mode } from "./Mode.mjs";
import { Colors } from "../dmd/Colors.mjs";
import { Utils } from "../utils/Utils.mjs";
import { ScoreEffectGPURenderer } from "../renderers/ScoreEffectGPURenderer.mjs";

/**
 * This mode runs all the time and is responsible of updating the score / player / ball texts
 */
class GameMode extends Mode {
    #startSound;
    #mainMusic;
    #scoreLayer;
    #hudLayer1;
    #hudLayer2;
    #score;
    #to;


    constructor(_dmd, _resources, _fonts, _variables, _audioManager) {
        super(_dmd, _resources, _fonts, _variables, _audioManager);

        this.name = 'game';
        this.#startSound = this._resources.getSound('start');
        this.#mainMusic = this._resources.getMusic('main');

        this.#score = 0;
        this.#to = null;

    }

    init() {
        super.init();

        const that = this;

		this.#hudLayer1 = this._dmd.addLayer({
			name : 'hud-1',
			type : 'text',
			zIndex : 1000,
			visible : false
		});			

		
		this.#hudLayer1.content.addText('ball-text', this._resources.getString('ballText'), {
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

		this.#hudLayer1.content.addText('player-text', this._resources.getString('playerText') + ":", {
			fontSize : '10',
			fontFamily : 'Dusty',
			left : 2,
			vAlign : 'bottom',
			yOffset : -1,
			color : Colors.white,
			strokeWidth : 2,
			strokeColor : Colors.blue
		});		

		const scoreRenderer = new ScoreEffectGPURenderer(this._dmd.dmdWidth, this._dmd.dmdHeight);

		scoreRenderer.init().then(device => {

			that.#scoreLayer = this._dmd.addLayer({
				name : 'score',
				type : 'text',
				zIndex : 1001,
				visible : false,
				renderer : scoreRenderer
			});	
	
			that.#scoreLayer.content.addText('score', 0, {
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

			that.#hudLayer2 = this._dmd.addLayer({
				name : 'hud-2',
				type : 'text',
				zIndex : 1000,
				visible : false,
				renderer: scoreRenderer
			});			
	
			that.#hudLayer2.content.addText('ball-value', 1, {
				fontSize : '10',
				fontFamily : 'Dusty',
				align : 'right',
				xOffset : -2,
				vAlign : 'bottom',
				yOffset : -1,
				color : Colors.white,
				strokeWidth : 2,
				strokeColor : Colors.blue
			});
	
			that.#hudLayer2.content.addText('player-value', 1, {
				fontSize : '10',
				fontFamily : 'Dusty',
				left : 15,
				vAlign : 'bottom',
				yOffset : -1,
				color : Colors.white,
				strokeWidth : 2,
				strokeColor : Colors.blue
			});
		});

    }


    /**
     * player.players data got updated
     * @param {event} event 
     * @param {object} data 
     */
    #onPlayersChanged(event, data) {
        var currentPlayer = this._variables.get('player', 'player', 1);
        var ballBefore = 0;
        var scoreBefore = 0;

        if (typeof data.before !== undefined && (data.after.length > data.before.length)) {
            this._audioManager.playSound('start', 'extra-player-start-sound');
        }
        
        if (typeof data.before !== undefined && typeof data.before[currentPlayer - 1] !== 'undefined') {
            ballBefore = data.before[currentPlayer - 1].ball || 1;
            scoreBefore = data.before[currentPlayer - 1].score || 0;
        }

        if (data.after[currentPlayer - 1].score !== scoreBefore) {
            console.log("Score Changed", data.after[currentPlayer - 1].score);
            this.#scoreLayer.content.getText('score').setText(data.after[currentPlayer - 1].score);
        }

        // Needed for 1 player game since #onPlayerChanged() is not called
        if (data.after[currentPlayer - 1].ball !== ballBefore) {
            console.log("Ball Changed", data.after[currentPlayer - 1].ball);
            this.#hudLayer2.content.getText('ball-value').setText(data.after[currentPlayer - 1].ball);
        }
    }

    /**
     * player.player data got updated
     * @param {event} event 
     * @param {object} data 
     */
    #onPlayerChanged(event, data) {
        console.log("Player changed", data);
        var player = data.after; // player for which data changed
        var playersData = this._variables.get('player', 'players', []);

        // if players data found update texts
        if (playersData.length) {
            var playerData = playersData[player - 1];
            this.#hudLayer2.content.getText('player-value').setText(player);
            this.#hudLayer2.content.getText('ball-value').setText(playerData.ball);
            this.#scoreLayer.content.getText('score').setText(playerData.score);
        }

    }

    start(priority) {
        // Ugly but not sure howto do better
        if (!super.start(priority)) {
            return;
        }

        var that = this;

        //this.#hudLayer1 = this._dmd.getLayer('hud-1');			
        //this.#hudLayer2 = this._dmd.getLayer('hud-2');			
		//this.#scoreLayer = this._dmd.getLayer('score');			

        PubSub.subscribe('variable.player.players.changed', this.#onPlayersChanged.bind(this));

        PubSub.subscribe('variable.player.player.changed', this.#onPlayerChanged.bind(this));

        this._audioManager.playSound('start', 'start-first-player-sound');

        if (!this._audioManager.isLoaded('main')) {
            PubSub.subscribe('sound.main.loaded', function() {
                console.log("main music loaded");
                setTimeout(that.#startMainMusic.bind(that), 1000);
            });
            this._audioManager.loadSound(this.#mainMusic, 'main');
        } else {
            setTimeout(this.#startMainMusic.bind(this), 1000);
        }

        this.#hudLayer1.setVisibility(true);
        this.#hudLayer2.setVisibility(true);

        this.#scoreLayer.setVisibility(true);

        // Start random score incrementer
        //this.#to = setTimeout(this.#addScore.bind(this), Math.random()* 1000);
    }

    #addScore() {
        this.#score += Math.floor(Math.random()*1001)*5;
        this.#scoreLayer.content.getText('score').setText(Utils.formatScore(this.#score));
        this.#to = setTimeout(this.#addScore.bind(this), Math.floor(Math.random()* 2000)+ 500);
    }

    stop() {
        super.stop();

        PubSub.unsubscribe('variable.player.players.changed');
        PubSub.unsubscribe('variable.player.player.changed');

        this._audioManager.stopSound('main-music');

        this.#hudLayer1.setVisibility(false);
        this.#hudLayer2.setVisibility(false);

        this.#scoreLayer.setVisibility(false);

        this._variables.set('player', 'player', 0);
        this._variables.set('player', 'players', []);

        clearTimeout(this.#to);
        //this._audioManager.playSound('gameover', 'gameover-sound');
    }

    #startMainMusic() {
        this._audioManager.playSound('main','main-music', true);
    }
}

export { GameMode };