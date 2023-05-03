import { DMD } from "../dmd/DMD.js"
import { Mode } from "./Mode.js"
import { Colors } from "../dmd/Colors.js"
import { Utils } from "../utils/Utils.js"
import { ResourcesManager } from "../managers/ResourcesManager.js"
import { VariablesManager } from "../managers/VariablesManager.js"
import { AudioManager } from "../managers/AudioManager.js"
import { TextLayer } from "../dmd/layers/TextLayer.js"
import { Options } from "../utils/Options.js"
import { IPubSubBeforeAfterMessage } from "../utils/PubSub.js"
import { ILayerRendererDictionary } from "../dmd/renderers/LayerRenderer.js"
import { NoiseEffectRenderer } from "../renderers/NoiseEffectRenderer.js"

//import { ScoreEffectRenderer } from "../renderers/ScoreEffectRenderer.mjs"
//import { RemoveAlphaRenderer } from "../renderers/RemoveAlphaRenderer.mjs"


/**
 * This mode runs all the time and is responsible of updating the score / player / ball texts
 */
class GameMode extends Mode {
    private _scoreLayer: TextLayer
    private _playerTextLayer: TextLayer
    private _playerValueLayer: TextLayer
    private _ballTextLayer: TextLayer
    private _ballValueLayer: TextLayer
    private _score: number
    private _to: NodeJS.Timer


    constructor(_dmd: DMD, _resourcesManager: ResourcesManager, _variablesManager: VariablesManager, _audioManager: AudioManager) {
        super('game', _dmd, _resourcesManager, _variablesManager, _audioManager)

        this._score = 0
        this._to = null
    }

    init() {
        super.init()

        const that = this

		// Build array of path to noise images
        // TODO : Get from resource manager
		var noises: string[] = []
		for (var i = 0 ; i < 6 ; i++) {
			noises.push(`resources/images/noises/noise-${i}.png`)
		}

        this._resourcesManager
        .getSound('start')
        .load()
        .then( audioBuffer => {
            this._audioManager.addSound('start', audioBuffer)
        })
        
        //this._audioManager.addSound('main', this._resourcesManager.getMusic('main').resource)


		this._playerTextLayer = this._dmd.createTextLayer(
            'player-text',
            {
                width : 15,
                height : 15,
                left : 0,
                vAlign : 'bottom',
            },
            new Options({
                text : this._resourcesManager.getString('playerText'),
                fontSize : 90,
                fontFamily : 'Dusty',
                color : Colors.White,
                strokeWidth : 2,
                strokeColor : Colors.Blue,
                zIndex : 1001,
                visible : false,
                groups: ['hud']
		    })
        )


		this._ballTextLayer = this._dmd.createTextLayer(
            'ball-text',
            {
                width: 60,
                height: 15,
                hAlign : 'right',
                hOffset : -15,
                vAlign : 'bottom',
            }
            , new Options({
                text : this._resourcesManager.getString('ballText'),
                fontSize : 90,
                fontFamily : 'Dusty',
                color : Colors.White,
                strokeWidth: 2,
                strokeColor : Colors.Blue,
                zIndex : 1001,
                visible : false,
                groups: ['hud']
		    })
        )

       
        this._playerValueLayer = this._dmd.createTextLayer(
            'player-value',
            {
                width : 10,
                height: 15,
                left : 15, // Fix %,
                vAlign : 'bottom'
            },
            new Options({
                text : "0",
                fontSize : 90,
                fontFamily : 'Dusty',
                color : Colors.White,
                strokeWidth: 2,
                strokeColor : Colors.Blue,
                visible : false,
                groups: ['hud'],
                renderers : ['score-effect']
            }),
            { "score-effect" : new NoiseEffectRenderer(10, 15, 200, noises) }
        )


        that._ballValueLayer = this._dmd.createTextLayer(
            'ball-value',
            {
                width : 15,
                height: 15,
                hAlign: 'right',
                vAlign: 'bottom'
            },
            new Options({
                text : "0",
                fontSize : 90,
                fontFamily : 'Dusty',
                color : Colors.White,
                strokeWidth : 2,
                strokeColor : Colors.Blue,
                zIndex : 1001,
                aaTreshold : 144,
                antialiasing : false,
                visible : false,
                groups: ['hud'],
                renderers : ['score-effect']
            }),
            { "score-effect" : new NoiseEffectRenderer(15, 15, 200, noises) }
        )

        that._scoreLayer = this._dmd.createTextLayer(
            'score',
            {},
            new Options({
                text : "0",
                fontSize : 40,
                fontFamily : 'Dusty',
                hAlign : 'right',
                hOffset : -1,
                vAlign : 'middle',
                color : Colors.White,
                outlineWidth : 2,
                outlineColor : Colors.Blue,
                adjustWidth : true,
                zIndex : 1000,
                aaTreshold : 144,
                antialiasing : false,
                visible : false,
                groups: ['hud'],
                renderers : ['score-effect']
            }),
            { "score-effect" : new NoiseEffectRenderer(this._dmd.width, this._dmd.height, 200, noises) } as ILayerRendererDictionary
        )
    }

    /**
     * player.players data got updated
     * @param {object} data 
     */
    private _onPlayersChanged(data: IPubSubBeforeAfterMessage) { //Todo Check any
        const currentPlayer = this._variablesManager.get('player', 'player', 1) // Player 1 = index 0
        const playerIndex = currentPlayer - 1

        // nothing to do
        if (currentPlayer === 0) {
            console.log("_onPlayersChanged() : nothing to do")
            return
        }

        var ballBefore = 0
        var scoreBefore = 0

        console.log(`Current player = ${currentPlayer}`)

        // + player sound start
        if (typeof data.before !== undefined && (data.after.length > data.before.length)) {
            this._audioManager.playSound('start', `player-${currentPlayer}-start-sound`)
        }
        
        // Previous values
        if (typeof data.before !== undefined && typeof data.before[playerIndex] !== 'undefined') {
            ballBefore = data.before[playerIndex].ball || 1
            scoreBefore = data.before[playerIndex].score || 0
        }

        // Score changed
        if (data.after[playerIndex].score !== scoreBefore) {
            console.log("Score Changed", data.after[playerIndex].score)
            this._scoreLayer.setText(Utils.formatScore(data.after[playerIndex].score))
        }

        // Needed for 1 player game since #onPlayerChanged() is not called
        if (data.after[playerIndex].ball !== ballBefore) {
            console.log("Ball Changed", data.after[playerIndex].ball)
            this._ballValueLayer.setText(data.after[playerIndex].ball.toString())
        }
    }

    /**
     * player.player data got updated
     * @param {object} before
     * @param {object} after 
     */
    _onPlayerChanged(data: IPubSubBeforeAfterMessage) { // TODO: Check any
        console.log(`Player changed from ${data.before} to ${data.after}`)

        var player = data.after // player for which data changed
        var playersData = this._variablesManager.get('player', 'players', [])

        if (data.after != data.before) {
            this._playerValueLayer.setText(player.toString())

            // if players data found update texts
            if (playersData[player - 1] !== undefined) {
                var playerData = playersData[player - 1]
                this._ballValueLayer.setText(playerData.ball.toString())
                this._scoreLayer.setText(Utils.formatScore(playerData.score.toString()))
            }
        }
    }

    start(priority: number): boolean {
        // Ugly but not sure howto do better
        if (!super.start(priority)) {
            return false
        }

        var that = this

        this._variablesManager.subscribe('variable.player.players.changed', this._onPlayersChanged.bind(this))

        this._variablesManager.subscribe('variable.player.player.changed', this._onPlayerChanged.bind(this))


        //this._audioManager.playSound('start', 'start-first-player-sound')

        if (this._dmd.brightness == 1) {
            this._dmd.fadeOut(150).then(() => {


                that._dmd.setLayerGroupVisibility('hud', true)
        
                that._resourcesManager
                .getMusic('main')
                .load()
                .then( audioBuffer => {
                    that._audioManager.addSound('main', audioBuffer)
                    setTimeout(that._startMainMusic.bind(that), 1000)
                })
                .catch(error => {
                    throw Error(`getMusic("main").load() failed : ${error}`)
                })

                that._dmd.fadeIn(150)
            })

        }

        // Start random score incrementer
        //this._to = setTimeout(this._addScore.bind(this), Math.random()* 1000)
        return true
    }

    private _addScore() {
        this._score += Math.floor(Math.random()*1001)*5
        this._scoreLayer.setText(Utils.formatScore(this._score))
        this._to = setTimeout(this._addScore.bind(this), Math.floor(Math.random()* 2000)+ 500)
    }

    stop() {
        super.stop()

        this._variablesManager.unsubscribe('variable.player.players.changed', this._onPlayerChanged.bind(this))
        this._variablesManager.unsubscribe('variable.player.player.changed', this._onPlayersChanged.bind(this))

        this._audioManager.stopSound('main-music')

        this._dmd.setLayerGroupVisibility('hud', false)
        
        this._variablesManager.set('player', 'player', 0)
        this._variablesManager.set('player', 'players', [])

        clearTimeout(this._to)
        //this._audioManager.playSound('gameover', 'gameover-sound')
    }

    private _startMainMusic() {
        this._audioManager.playSound('main','main-music', true)
    }
}

export { GameMode }