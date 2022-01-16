import { DMD } from "../dmd/DMD.mjs";
import { Mode } from "./Mode.mjs";
import { Colors } from "../dmd/Colors.mjs";
import { Utils } from "../utils/Utils.mjs";
//import { ScoreEffectRenderer } from "../renderers/ScoreEffectRenderer.mjs";
//import { RemoveAlphaRenderer } from "../renderers/RemoveAlphaRenderer.mjs";


/**
 * This mode runs all the time and is responsible of updating the score / player / ball texts
 */
class GameMode extends Mode {
    #startSound;
    #mainMusic;
    #scoreLayer;
    #playerTextLayer;
    #playerValueLayer;
    #ballTextLayer;
    #ballValueLayer;
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

		this.#playerTextLayer = this._dmd.createLayer(DMD.LayerType.Text, 'player-text', {
            text : this._resources.getString('playerText'),
			fontSize : '10',
			fontFamily : 'Dusty',
			left : 2,
			vAlign : 'bottom',
			yOffset : -1,
			color : Colors.white,
			//outlineWidth : 1,
			//outlineColor : Colors.blue,
            //aaTreshold : 144,
            //antialiasing : false,
            strokeWidth : 2,
            strokeColor : Colors.blue,
			zIndex : 1001,
			visible : false,
            groups: ['hud']
		});			


		this.#ballTextLayer = this._dmd.createLayer(DMD.LayerType.Text, 'ball-text', {
            text : this._resources.getString('ballText'),
			fontSize : '10',
			fontFamily : 'Dusty',
			align : 'right',
			xOffset : -11,
			vAlign : 'bottom',
			yOffset : -1,
			color : Colors.white,
			//outlineWidth : 1,
			//outlineColor : Colors.blue,
            strokeWidth: 2,
            strokeColor : Colors.blue,
            //aaTreshold : 144,
            //antialiasing : false,
			zIndex : 1001,
			visible : false,
            groups: ['hud']            
		});			

       
        this.#playerValueLayer = this._dmd.createLayer(DMD.LayerType.Text, 'player-value', {
            text : "0",
            fontSize : '10',
            fontFamily : 'Dusty',
            left : 13,
            vAlign : 'bottom',
            yOffset : -1,
            color : Colors.white,
            //outlineWidth : 1,
            //outlineColor : Colors.blue,
            //aaTreshold : 144,
            //antialiasing : false,
            strokeWidth: 2,
            strokeColor : Colors.blue,
            visible : false,
            groups: ['hud'],
            renderers : ['score-effect']
        });


        that.#ballValueLayer = this._dmd.createLayer(DMD.LayerType.Text, 'ball-value', {
            text : "1",
            fontSize : '10',
            fontFamily : 'Dusty',
            align : 'right',
            xOffset : -2,
            vAlign : 'bottom',
            yOffset : -1,
            color : Colors.white,
            outlineWidth : 1,
            outlineColor : Colors.blue,
            zIndex : 1001,
            aaTreshold : 144,
            antialiasing : false,
            visible : false,
            groups: ['hud'],
            renderers : ['score-effect']
        });			

        that.#scoreLayer = this._dmd.createLayer(DMD.LayerType.Text, 'score', {
            //text : "0123456789",
            text : "0",
            fontSize : '40',
            fontFamily : 'Dusty',
            align : 'right',
            xOffset : -1,
            vAlign : 'middle',
            color : Colors.white,
            outlineWidth : 1,
            outlineColor : Colors.blue,
            adjustWidth : true,
            zIndex : 1000,
            aaTreshold : 144,
            antialiasing : false,
            visible : false,
            groups: ['hud'],
            renderers : ['score-effect']
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
            this.#scoreLayer.setText(Utils.formatScore(data.after[currentPlayer - 1].score));
        }

        // Needed for 1 player game since #onPlayerChanged() is not called
        if (data.after[currentPlayer - 1].ball !== ballBefore) {
            console.log("Ball Changed", data.after[currentPlayer - 1].ball);
            this.#ballValueLayer.setText(data.after[currentPlayer - 1].ball.toString());
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
            this.#playerValueLayer.setText(player.toString());
            this.#ballValueLayer.setText(playerData.ball.toString());
            this.#scoreLayer.setText(Utils.formatScore(playerData.score.toString()));
        }

    }

    start(priority) {
        // Ugly but not sure howto do better
        if (!super.start(priority)) {
            return;
        }

        var that = this;

        PubSub.subscribe('variable.player.players.changed', this.#onPlayersChanged.bind(this));

        PubSub.subscribe('variable.player.player.changed', this.#onPlayerChanged.bind(this));

        this._audioManager.playSound('start', 'start-first-player-sound');

        if (this._dmd.brightness == 1) {
            this._dmd.fadeOut(150).then(() => {


                that._dmd.setLayerGroupVisibility('hud', true);
        

                if (!that._audioManager.isLoaded('main')) {
                    PubSub.subscribe('sound.main.loaded', function() {
                        console.log("main music loaded");
                        setTimeout(that.#startMainMusic.bind(that), 1000);
                    });
                    that._audioManager.loadSound(that.#mainMusic, 'main');
                } else {
                    setTimeout(that.#startMainMusic.bind(that), 1000);
                }
        
                that._dmd.fadeIn(150);
            });

        }

        // Start random score incrementer
        //this.#to = setTimeout(this.#addScore.bind(this), Math.random()* 1000);
    }

    #addScore() {
        this.#score += Math.floor(Math.random()*1001)*5;
        this.#scoreLayer.setText(Utils.formatScore(this.#score));
        this.#to = setTimeout(this.#addScore.bind(this), Math.floor(Math.random()* 2000)+ 500);
    }

    stop() {
        super.stop();

        PubSub.unsubscribe('variable.player.players.changed');
        PubSub.unsubscribe('variable.player.player.changed');

        this._audioManager.stopSound('main-music');

        this._dmd.setLayerGroupVisibility('hud', false);
        
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