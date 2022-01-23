import { Mode } from './Mode.mjs';
import { Colors } from '../dmd/Colors.mjs';
import { Utils } from '../utils/Utils.mjs';
import { DMD } from '../dmd/DMD.mjs';

//const ATTRACT_MUSIC_RESTART_DELAY = 300000; // 5 min
const ATTRACT_MUSIC_RESTART_DELAY = 30000;

const ATTRACT_RESTART_TIMEOUT = 30000;

class AttractMode extends Mode {
    #blinkInterval;
    #attractRestartTO;
    #attractMusicTO;
    #startLayer;
    #titleLayer1;
    #titleLayer2;
    #subTitleLayer;
    #creditsLayer;
    #backgroundLayer;
    #gameOverCloudsVideoLayer;
    #gameOverCloudsLayer2;
    #gameOverBackgroundLayer;
    #gameOverTextLayer;
    #gameOverScoresLayer;
    #gameIsPlaying;
    #delayAttractMusic;

    constructor(_dmd, _resources, _fonts, _variables, _audioManager) {
        super(_dmd, _resources, _fonts, _variables, _audioManager);
        this.name = 'attract';

        //this.init();
    }

    init() {
        super.init();

        // Credit string var is not initialized at this point
        var creditsString = this._variables.get('machine', 'credits_string', ".");
        var startString = this._resources.getString('attractModeStart');
        var goString = this._resources.getString('gameOver');

        // Listen to credits string var changes to update the text in the layer
        PubSub.subscribe('variable.machine.credits_string.changed', this.#onCreditsStringChanged.bind(this));

        this.#backgroundLayer = this._dmd.createLayer(DMD.LayerType.Image, 'attract-background', {
            src : this._resources.getImage('title'),
            visible : false,
            groups : ['title']
        });

        this.#titleLayer1 = this._dmd.createLayer(DMD.LayerType.Text, 'attract-title1', {
            text :  'SCOTT',
            fontSize : 30,
            fontFamily : 'Superfly',
            left : '52%',
            top : '2%',
            color : Colors.blue,
            strokeWidth : 2,
            strokeColor : Colors.white,
            visible : false,
            groups : ['title']
        });

        this.#titleLayer2 = this._dmd.createLayer(DMD.LayerType.Text, 'attract-title2', {
            text : 'PILGRIM',
            fontSize : 30,
            fontFamily : 'Superfly',
            left : '52%',
            top : '32%',
            color : Colors.blue,
            strokeWidth : 2,
            strokeColor : Colors.white,
            visible : false,
            groups : ['title']
        });

        this.#subTitleLayer = this._dmd.createLayer(DMD.LayerType.Text, 'attract-subtitle', {
            text : 'VS. THE WORLD',
            fontSize : '10',
            fontFamily : 'Dusty',
            left : '52.5%',
            top : '62%',
            color : Colors.red,
            visible : false,
            groups : ['title'],
//            renderers : ['no-antialiasing']
        });


        this.#startLayer = this._dmd.createLayer(DMD.LayerType.Text, 'attract-start', {
            text : startString,
            fontSize: '10',
            fontFamily : 'Dusty',
            align : 'center',
            vAlign : 'bottom',
            vOffset: -2,
            strokeWidth : 2,
            strokeColor : Colors.red,            
            visible : false
        });

        this.#creditsLayer = this._dmd.createLayer(DMD.LayerType.Text, 'attract-credits', {
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
        });


        this.#gameOverCloudsVideoLayer = this._dmd.createLayer(DMD.LayerType.Video, 'gameover-clouds-moving', {
            src : this._resources.getVideo('gameover-clouds'),
            visible : false,
            autoplay : false,
            loop : true
        });

        this.#gameOverCloudsLayer2 = this._dmd.createLayer(DMD.LayerType.Image, 'gameover-clouds-static', {
            src : this._resources.getImage('gameover-clouds'),
            visible : false,
            loop : true
        });
        

        //console.log(this._resources.getImage('game-over'));

        this.#gameOverBackgroundLayer = this._dmd.createLayer(DMD.LayerType.Image, 'gameover-bg', {
            src : this._resources.getImage('gameover-bg'),
            visible : false
        });
        
        this.#gameOverTextLayer = this._dmd.createLayer(DMD.LayerType.Text, 'gameover-text', {
            text : goString,
            fontSize: '20',
            fontFamily : 'Dusty',
            align : 'center',
            top: 1,
            outlineWidth : 1,
            outlineColor : Colors.red,
            antialiasing : false,
            aaTreshold : 144,
            opacity : 0.8,
            visible : false
        });


        //this.#gameOverScoresLayer = this._dmd.createLayer({ name : 'game-over-scores', type: 'text', visible : false});

        this.#gameIsPlaying = false;        
        this.#delayAttractMusic = false;
    }


    // Update credit string
    #onCreditsStringChanged(ev, data) {
        this.#creditsLayer.setText(data.after);
    }

    start(priority) {
        // Ugly but not sure howto do better
        if (!super.start(priority)) {
            return;
        }

        var that = this;

        var players = that._variables.get('player', 'players', []);

        // TODO Add Game over / highscores / attract screens cycle

        if (this.#gameIsPlaying) {
            this.#gameIsPlaying = false;

            this._dmd.fadeOut(150).then(() => { 

                that.#gameOverCloudsVideoLayer.setVisibility(true);
                that.#gameOverCloudsVideoLayer.play();

                that.#gameOverCloudsLayer2.setVisibility(true);
                that.#gameOverBackgroundLayer.setVisibility(true);
                that.#gameOverTextLayer.setVisibility(true);
                //that.#gameOverScoresLayer.setVisibility(true);

    
  
                that._dmd.fadeIn(150).then(() => {

                    //console.log(players);
    
                    var top = (players.length-1) * 3 * -1 + 5;
                    var timeout = 0;

                    players.forEach( (p,i) => {
    
                        setTimeout(function() {
                            var score = Utils.formatScore(p.score);
                            //var score = Utils.formatScore(Math.round(Math.random()*50000000000));

                            //console.log(score);
        
                            var pTxt = that._resources.getString('playerTextLong') + ` ${i+1}`;

                            that._dmd.createLayer(DMD.LayerType.Text, `game-over-score-${i}`, {
                                text : `${pTxt} : ${score.toString()}`,
                                fontSize: '10',
                                fontFamily : 'Dusty',
                                left : 50,
                                vAlign : 'middle',
                                vOffset : top                                
                            });
        
                            that._audioManager.playSound('dong', `dong-p${i+1}`);
        
                            top += 10;
                        } , timeout);
        
                        timeout += 1000;
        
                    });

                });


            });

            this.#attractRestartTO = setTimeout(function() {

                that._dmd.fadeOut(150).then( () => {
                    that.#gameOverCloudsVideoLayer.setVisibility(false);
                    that.#gameOverCloudsVideoLayer.stop();

                    that.#gameOverCloudsLayer2.setVisibility(false);
                    that.#gameOverBackgroundLayer.setVisibility(false);
                    that.#gameOverTextLayer.setVisibility(false);
                    //that.#gameOverScoresLayer.setVisibility(false);
                    //that.#gameOverScoresLayer.removeAllTexts();
                    players.forEach( (p,i) => {
                        that._dmd.removeLayer(`game-over-score-${i}`);
                    });


                    that.#delayAttractMusic = true;
                    that.start(priority);
                });

            }, ATTRACT_RESTART_TIMEOUT);

       
        // Start attractmode
        } else {

            this.#backgroundLayer.setVisibility(true);
            this.#titleLayer1.setVisibility(true);
            this.#titleLayer2.setVisibility(true);
            this.#subTitleLayer.setVisibility(true);
            this.#creditsLayer.setVisibility(true);
            this.#startLayer.setVisibility(false);
            this.#blinkInterval = setInterval(this.#toggleStartText.bind(this), 1000);

            if (this._dmd.brightness < 1) {
                this._dmd.fadeIn(150).then(() => {
                    that.#startAttractMusicIfNeeded();
                });
            } else {
                this.#startAttractMusicIfNeeded();
            }
    

        }
    }

    #startAttractMusicIfNeeded() {
        if (this.#delayAttractMusic) {
            this.#attractMusicTO = setTimeout(this.#startAttractMusic.bind(this), ATTRACT_MUSIC_RESTART_DELAY);
            this.#delayAttractMusic = false;
        } else {
            this.#startAttractMusic();
        }
    }

    #startAttractMusic() {
        this._audioManager.playSound('attract', 'attract-music', false, this.#onMusicEnded.bind(this));
    }

    #toggleStartText = function() {
        this.#startLayer.toggleVisibility();
    }

    #onMusicEnded() {
        if (this.isStarted()) {
            console.log("onMusicEnded() : Attract music ended, restarting later");
            this.#attractMusicTO = setTimeout(this.#startAttractMusic.bind(this), ATTRACT_MUSIC_RESTART_DELAY);
        } else {
            console.log("onMusicEnded() : Mode not started so I will not restart attract music");
        }
    }

    stop() {
        super.stop();

        this._audioManager.stopSound('attract-music');

        this.#backgroundLayer.setVisibility(false);
        this.#titleLayer1.setVisibility(false);
        this.#titleLayer2.setVisibility(false);
        this.#subTitleLayer.setVisibility(false);
        this.#creditsLayer.setVisibility(false);
        this.#startLayer.setVisibility(false);

        this.#gameOverCloudsVideoLayer.setVisibility(false);
        this.#gameOverCloudsVideoLayer.stop();

        this.#gameOverCloudsLayer2.setVisibility(false);
        this.#gameOverBackgroundLayer.setVisibility(false);
        this.#gameOverTextLayer.setVisibility(false);
        
        //this.#gameOverScoresLayer.setVisibility(false);
        //this.#gameOverScoresLayer.removeAllTexts();


        clearTimeout(this.#attractMusicTO);
        this.#attractMusicTO = null;

        clearTimeout(this.#attractRestartTO);
        this.#attractRestartTO = null;

        clearInterval(this.#blinkInterval);
        this.#blinkInterval =  null;

        // Set variable so that attract mode knows a game was playing
        this.#gameIsPlaying = true; // TODO : get that from game mode maybe since base mode is always started during game
    }
}

export { AttractMode };