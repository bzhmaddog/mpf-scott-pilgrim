import { Mode } from './Mode.js';
import { Colors } from '../dmd/Colors.js';
import { Utils } from '../utils/Utils.js';
import { DMD } from '../dmd/DMD.js';
import { TextLayer } from '../dmd/layers/TextLayer.js';
import { CanvasLayer } from '../dmd/layers/CanvasLayer.js';
import { VideoLayer } from '../dmd/layers/VideoLayer.js';
import { ResourcesManager } from '../managers/ResourcesManager.js';
import { VariablesManager, IVariableChangeEvent } from '../managers/VariablesManager.js';
import { AudioManager } from '../managers/AudioManager.js';
import { Options } from '../utils/Options.js';

//const ATTRACT_MUSIC_RESTART_DELAY = 300000; // 5 min
const ATTRACT_MUSIC_RESTART_DELAY = 30000;

const ATTRACT_RESTART_TIMEOUT = 30000;

class AttractMode extends Mode {
    private _blinkInterval: NodeJS.Timer; // WTF
    private _attractRestartTO: NodeJS.Timer;
    private _attractMusicTO: NodeJS.Timer;
    private _startLayer: TextLayer;
    private _titleLayer1: TextLayer;
    private _titleLayer2: TextLayer;
    private _subTitleLayer: TextLayer;
    private _creditsLayer: TextLayer;
    private _backgroundLayer: CanvasLayer;
    private _gameOverCloudsVideoLayer: VideoLayer;
    private _gameOverCloudsLayer2: CanvasLayer;
    private _gameOverBackgroundLayer: CanvasLayer;
    private _gameOverTextLayer: TextLayer;
    private _gameOverScoresLayer: TextLayer;
    private _gameIsPlaying: boolean;
    private _delayAttractMusic: boolean;

    constructor(_dmd: DMD, _resourcesManager: ResourcesManager, _variablesManager: VariablesManager, _audioManager: AudioManager) {
        super('attract', _dmd, _resourcesManager, _variablesManager, _audioManager);
    }
    
    init() {
        const that = this;

        super.init();

        this._audioManager.addSound('attract', this._resourcesManager.getMusic('attract').resource);

        // Credit string var is not initialized at this point
        var creditsString = this._variablesManager.get('machine', 'credits_string', ".");

        var startString = this._resourcesManager.getString('attractModeStart');
        var goString = this._resourcesManager.getString('gameOver');

        // Listen to credits string var changes to update the text in the layer
        this._variablesManager.subscribe('variable.machine.credits_string.changed', this._onCreditsStringChanged.bind(this));

        this._backgroundLayer = this._dmd.createCanvasLayer('attract-background', new Options({
            visible : false,
            groups : ['title']
        }), function(layer: CanvasLayer) {
            that._resourcesManager
                .getImage('title')
                .load()
                .then(bitmap => {
                    layer.drawImage(bitmap, new Options({
                        width: '100%',
                        height: '100%'
                    }));
                });
        });

        this._titleLayer1 = this._dmd.createTextLayer('attract-title1', new Options({
            text :  'SCOTT',
            fontSize : 30,
            fontFamily : 'Superfly',
            left : '52%',
            top : '2%',
            color : Colors.Blue,
            strokeWidth : 2,
            strokeColor : Colors.White,
            visible : false,
            groups : ['title']
        }));

        this._titleLayer2 = this._dmd.createTextLayer('attract-title2', new Options({
            text : 'PILGRIM',
            fontSize : 30,
            fontFamily : 'Superfly',
            left : '52%',
            top : '32%',
            color : Colors.Blue,
            strokeWidth : 2,
            strokeColor : Colors.White,
            visible : false,
            groups : ['title']
        }));

        this._subTitleLayer = this._dmd.createTextLayer('attract-subtitle', new Options({
            text : 'VS. THE WORLD',
            fontSize : '10',
            fontFamily : 'Dusty',
            left : '52.5%',
            top : '62%',
            color : Colors.Red,
            visible : false,
            groups : ['title'],
//            renderers : ['no-antialiasing']
        }));


        this._startLayer = this._dmd.createTextLayer('attract-start', new Options({
            text : startString,
            fontSize: '10',
            fontFamily : 'Dusty',
            align : 'center',
            vAlign : 'bottom',
            vOffset: -2,
            strokeWidth : 2,
            strokeColor : Colors.Red,
            visible : false
        }));

        this._creditsLayer = this._dmd.createTextLayer('attract-credits', new Options({
            text : creditsString,
            fontSize : '9',
            fontFamily : 'Dusty',
            align: 'right',
            vAlign: 'bottom',
            hOffset : -2,
            vOffset : -1,
            visible : false,
            //aaTreshold : 144,
            //antialiasing : false
        }));


        // TODO : Load video in callback
        this._gameOverCloudsVideoLayer = this._dmd.createVideoLayer('gameover-clouds-moving', new Options({
            visible : true,
            autoplay : false,
            loop : true
        }), (layer: VideoLayer) => {
            layer.setVideo(this._resourcesManager.getVideo('gameover-clouds').resource)
            //layer.play();
        });

        this._gameOverCloudsLayer2 = this._dmd.createCanvasLayer('gameover-clouds-static', new Options({
            visible : false,
            loop : true
        }), (layer: CanvasLayer) => {
            that._resourcesManager
            .getImage('gameover-clouds')
            .load()
            .then(bitmap => {
                layer.drawImage(bitmap, new Options({
                    width: '100%',
                    height: '100%'
                }));
            });
        });
        

        //console.log(this._resources.getImage('game-over'));

        this._gameOverBackgroundLayer = this._dmd.createCanvasLayer('gameover-bg', new Options({
            visible : false
        }), (layer: CanvasLayer) => {
            that._resourcesManager
            .getImage('gameover-bg')
            .load()
            .then(bitmap => {
                layer.drawImage(bitmap, new Options({
                    width: '100%',
                    height: '100%'
                }));
            });
        });
        
        this._gameOverTextLayer = this._dmd.createTextLayer('gameover-text', new Options({
            text : goString,
            fontSize: '20',
            fontFamily : 'Dusty',
            align : 'center',
            top: 1,
            outlineWidth : 1,
            outlineColor : Colors.Red,
            antialiasing : false,
            aaTreshold : 144,
            opacity : 0.8,
            visible : false
        }));


        //this._gameOverScoresLayer = this._dmd.createLayer({ name : 'game-over-scores', type: 'text', visible : false});

        this._gameIsPlaying = false;
        this._delayAttractMusic = false;
    }


    // Update credit string
    private _onCreditsStringChanged(event: IVariableChangeEvent) {
        this._creditsLayer.setText(event.after as string);
    }

    start(priority: number): boolean {
        // Ugly but not sure howto do better
        if (!super.start(priority)) {
            return false;
        }

        const that = this;

        var players = that._variablesManager.get('player', 'players', []);

        // TODO Add Game over / highscores / attract screens cycle

        if (this._gameIsPlaying) {
            this._gameIsPlaying = false;

            this._dmd.fadeOut(150).then(() => { 

                that._gameOverCloudsVideoLayer.setVisibility(true);
                that._gameOverCloudsVideoLayer.play();

                that._gameOverCloudsLayer2.setVisibility(true);
                that._gameOverBackgroundLayer.setVisibility(true);
                that._gameOverTextLayer.setVisibility(true);
                //that._gameOverScoresLayer.setVisibility(true);

    
  
                that._dmd.fadeIn(150).then(() => {

                    //console.log(players);
    
                    var top = (players.length-1) * 3 * -1 + 5;
                    var timeout = 0;

                    players.forEach( (p: any, i: number) => { // TODO Check Any
    
                        setTimeout(function() {
                            var score = Utils.formatScore(p.score);
                            //var score = Utils.formatScore(Math.round(Math.random()*50000000000));

                            //console.log(score);
        
                            var pTxt = that._resourcesManager.getString('playerTextLong') + ` ${i+1}`;

                            that._dmd.createTextLayer(`game-over-score-${i}`, new Options({
                                text : `${pTxt} : ${score.toString()}`,
                                fontSize: '10',
                                fontFamily : 'Dusty',
                                left : 50,
                                vAlign : 'middle',
                                vOffset : top
                            }));
        
                            that._audioManager.playSound('dong', `dong-p${i+1}`);
        
                            top += 10;
                        } , timeout);
        
                        timeout += 1000;
        
                    });

                });


            });

            this._attractRestartTO = setTimeout(function() {

                that._dmd.fadeOut(150).then( () => {
                    that._gameOverCloudsVideoLayer.setVisibility(false);
                    that._gameOverCloudsVideoLayer.stop();

                    that._gameOverCloudsLayer2.setVisibility(false);
                    that._gameOverBackgroundLayer.setVisibility(false);
                    that._gameOverTextLayer.setVisibility(false);
                    //that._gameOverScoresLayer.setVisibility(false);
                    //that._gameOverScoresLayer.removeAllTexts();
                    players.forEach( (p: number, i: number) => {
                        that._dmd.removeLayer(`game-over-score-${i}`);
                    });


                    that._delayAttractMusic = true;
                    that.start(priority);
                });

            }, ATTRACT_RESTART_TIMEOUT);

       
        // Start attractmode
        } else {

            this._backgroundLayer.setVisibility(true);
            this._titleLayer1.setVisibility(true);
            this._titleLayer2.setVisibility(true);
            this._subTitleLayer.setVisibility(true);
            this._creditsLayer.setVisibility(true);
            this._startLayer.setVisibility(false);
            this._blinkInterval = setInterval(this._toggleStartText.bind(this), 1000);

            if (this._dmd.brightness < 1) {
                this._dmd.fadeIn(150).then(() => {
                    that._startAttractMusicIfNeeded();
                });
            } else {
                this._startAttractMusicIfNeeded();
            }
    

        }

        return true;
    }

    private _startAttractMusicIfNeeded() {
        if (this._delayAttractMusic) {
            this._attractMusicTO = setTimeout(this._startAttractMusic.bind(this), ATTRACT_MUSIC_RESTART_DELAY);
            this._delayAttractMusic = false;
        } else {
            this._startAttractMusic();
        }
    }

    private _startAttractMusic() {
        this._audioManager.playSound('attract', 'attract-music', false, this._onMusicEnded.bind(this));
    }

    private _toggleStartText = function() {
        this._startLayer.toggleVisibility();
    }

    private _onMusicEnded() {
        if (this.isStarted()) {
            console.log("onMusicEnded() : Attract music ended, restarting later");
            this._attractMusicTO = setTimeout(this._startAttractMusic.bind(this), ATTRACT_MUSIC_RESTART_DELAY);
        } else {
            console.log("onMusicEnded() : Mode not started so I will not restart attract music");
        }
    }

    stop() {
        super.stop();

        this._audioManager.stopSound('attract-music');

        this._backgroundLayer.setVisibility(false);
        this._titleLayer1.setVisibility(false);
        this._titleLayer2.setVisibility(false);
        this._subTitleLayer.setVisibility(false);
        this._creditsLayer.setVisibility(false);
        this._startLayer.setVisibility(false);

        this._gameOverCloudsVideoLayer.setVisibility(false);
        this._gameOverCloudsVideoLayer.stop();

        this._gameOverCloudsLayer2.setVisibility(false);
        this._gameOverBackgroundLayer.setVisibility(false);
        this._gameOverTextLayer.setVisibility(false);
        
        //this._gameOverScoresLayer.setVisibility(false);
        //this._gameOverScoresLayer.removeAllTexts();


        clearTimeout(this._attractMusicTO);
        this._attractMusicTO = null;

        clearTimeout(this._attractRestartTO);
        this._attractRestartTO = null;

        clearInterval(this._blinkInterval);
        this._blinkInterval =  null;

        // Set variable so that attract mode knows a game was playing
        this._gameIsPlaying = true; // TODO : get that from game mode maybe since base mode is always started during game
    }
}

export { AttractMode };