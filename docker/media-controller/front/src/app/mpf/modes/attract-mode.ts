import {CanvasLayer, Colors, Options, TextLayer, VideoLayer} from 'h5dmd'
import {Mode} from "@mpf/modes/mode";
import {Utils} from "@mpf/utils/utils";
import {computed, effect, inject, Signal, untracked} from "@angular/core";
import {GameStore} from "../../store/game.store";
import {Player} from "@models/player";
import {Logger} from "../../utils/logger";

const ATTRACT_MUSIC_RESTART_DELAY = 30000
const ATTRACT_RESTART_TIMEOUT = 30000 * 2 * 5 // TODO Change

class AttractMode extends Mode {
  private _blinkInterval: number | undefined // WTF
  private _attractRestartTO: number | undefined
  private _attractMusicTO: number | undefined
  private _startLayer?: TextLayer
  private _titleLayer1?: TextLayer
  private _titleLayer2?: TextLayer
  private _subTitleLayer?: TextLayer
  private _creditsLayer?: TextLayer
  private _backgroundLayer!: CanvasLayer
  private _gameOverCloudsVideoLayer!: VideoLayer
  private _gameOverCloudsLayer2!: CanvasLayer
  private _gameOverBackgroundLayer!: CanvasLayer
  private _gameOverTextLayer!: TextLayer
  private _gameOverScoresLayer!: TextLayer
  private _gameIsPlaying: boolean
  private _delayAttractMusic: boolean

  private readonly _store = inject(GameStore)

  private creditString: Signal<string> = computed(() => this._store.variables()['credits_string'])

  constructor() {
    super('attract')
    this._gameIsPlaying = false
    this._delayAttractMusic = false
  }

  override init() {
    super.init()

    this._resourcesManager
      .getMusic('attract')
      .load()
      .then(audioBuffer => {
        this._audioManager.addSound('attract', audioBuffer)
      })

    this._resourcesManager
      .getSound('dong')
      .load()
      .then(audioBuffer => {
        this._audioManager.addSound('dong', audioBuffer)
      })

    // Credit string var is not initialized at this point

    const startString = this._resourcesManager.getString('attractModeStart')
    const goString = this._resourcesManager.getString('gameOver')

    const initialCreditString = this._resourcesManager.getString("freePlayInitialText")


    this._backgroundLayer = this._dmd.addCanvasLayer(
      'attract-background',
      {},
      new Options({
        visible: false,
        groups: ['title']
      }),
      {},
      () => {
        this._resourcesManager
          .getImage('title')
          .load()
          .then(bitmap => {
            this._backgroundLayer.drawBitmap(bitmap, new Options({
              width: '100%',
              height: '100%'
            }))
          })
      }
    )

    this._titleLayer1 = this._dmd.addTextLayer(
      'attract-title1',
      {},
      new Options({
        text: 'SCOTT',
        fontSize: 30,
        fontFamily: 'Superfly',
        left: '56%',
        top: '2%',
        color: Colors.Blue,
        strokeWidth: 2,
        strokeColor: Colors.White,
        visible: false,
        groups: ['title']
      })
    )

    this._titleLayer2 = this._dmd.addTextLayer(
      'attract-title2',
      {},
      new Options({
        text: 'PILGRIM',
        fontSize: 30,
        fontFamily: 'Superfly',
        left: '56%',
        top: '32%',
        color: Colors.Blue,
        strokeWidth: 2,
        strokeColor: Colors.White,
        visible: false,
        groups: ['title']
      })
    )

    this._subTitleLayer = this._dmd.addTextLayer(
      'attract-subtitle',
      {},
      new Options({
        text: 'VS. THE WORLD',
        fontSize: '10',
        fontFamily: 'Dusty',
        left: '56.5%',
        top: '62%',
        color: Colors.Red,
        visible: false,
        groups: ['title'],
      })
    )


    this._startLayer = this._dmd.addTextLayer(
      'attract-start',
      {},
      new Options({
        text: startString,
        fontSize: '10',
        fontFamily: 'Dusty',
        hAlign: 'center',
        vAlign: 'bottom',
        vOffset: -2,
        strokeWidth: 2,
        strokeColor: Colors.Red,
        visible: false
      })
    )

    this._creditsLayer = this._dmd.addTextLayer(
      'attract-credits',
      {
        width: 65,
        height: 8,
        hAlign: 'right',
        vAlign: 'bottom',
        //hOffset : -2,
        //vOffset : -1,
      },
      new Options({
        text: this.creditString() ?? initialCreditString,
        fontSize: 95,
        fontFamily: 'Dusty',
        color: Colors.White,
        visible: true
      })
    )


    // TODO : Load video in callback
    this._gameOverCloudsVideoLayer = this._dmd.addVideoLayer('gameover-clouds-moving', {}, new Options({
      visible: false,
      autoplay: false,
      loop: true
    }), {}, () => {
      this._resourcesManager
        .getVideo('gameover-clouds')
        .load()
        .then(videoElement => {
          this._gameOverCloudsVideoLayer.setVideo(videoElement)
        })

    })

    this._gameOverCloudsLayer2 = this._dmd.addCanvasLayer('gameover-clouds-static', {}, new Options({
      visible: false,
      loop: true
    }), {}, () => {
      this._resourcesManager
        .getImage('gameover-clouds')
        .load()
        .then(bitmap => {
          this._gameOverCloudsLayer2.drawBitmap(bitmap, new Options({
            width: '100%',
            height: '100%'
          }))
        })
    })


    //console.log(this._resources.getImage('game-over'))

    this._gameOverBackgroundLayer = this._dmd.addCanvasLayer(
      'gameover-bg',
      {},
      new Options({
        visible: false
      }), {}, () => {
        this._resourcesManager
          .getImage('gameover-bg')
          .load()
          .then(bitmap => {
            this._gameOverBackgroundLayer.drawBitmap(bitmap, new Options({
              width: '100%',
              height: '100%'
            }))
          })
      })

    this._gameOverTextLayer = this._dmd.addTextLayer(
      'gameover-text',
      {},
      new Options({
        text: goString,
        fontSize: '20',
        fontFamily: 'Dusty',
        align: 'center',
        top: 1,
        outlineWidth: 1,
        outlineColor: Colors.Red,
        antialiasing: false,
        aaTreshold: 144,
        opacity: 0.8,
        visible: false
      })
    )


    //this._gameOverScoresLayer = this._dmd.createLayer({ name : 'game-over-scores', type: 'text', visible : false})

    this._gameIsPlaying = false
    this._delayAttractMusic = false
  }

  override start(priority: number): boolean {
    // Ugly but not sure howto do better
    if (!super.start(priority)) {
      return false
    }

    // TODO Add Game over / highscores / attract screens cycle

    if (this._gameIsPlaying) {
      this._gameIsPlaying = false

      this._dmd.fadeOut(150).then(() => {

        this._gameOverCloudsVideoLayer.setVisibility(true)
        this._gameOverCloudsVideoLayer.play()

        this._gameOverCloudsLayer2.setVisibility(true)
        this._gameOverBackgroundLayer.setVisibility(true)
        this._gameOverTextLayer.setVisibility(true)
        //this._gameOverScoresLayer.setVisibility(true)


        this._dmd.fadeIn(150).then(() => {

          const players: Player[] = this._store.players()

          let top = (players.length - 1) * 3 * -1 + 5
          let timeout = 0

          players.forEach((p: Player, i: number) => { // TODO Check Any

            window.setTimeout(() => {
              const score = Utils.formatScore(p.score)
              const pTxt = this._resourcesManager.getString('playerTextLong') + ` ${i + 1}`

              this._dmd.addTextLayer(
                `game-over-score-${i}`,
                {},
                new Options({
                  text: `${pTxt} : ${score.toString()}`,
                  fontSize: '10',
                  fontFamily: 'Dusty',
                  left: 50,
                  vAlign: 'middle',
                  vOffset: top
                })
              )

              this._audioManager.playSound('dong', `dong-p${i + 1}`)

              top += 10
            }, timeout)

            timeout += 1000

          })


        })


      })

      this._attractRestartTO = window.setTimeout(() => {

        this._dmd.fadeOut(150).then(() => {
          this._gameOverCloudsVideoLayer.setVisibility(false)

          this._gameOverCloudsVideoLayer.stop()

          this._gameOverCloudsLayer2.setVisibility(false)
          this._gameOverBackgroundLayer.setVisibility(false)
          this._gameOverTextLayer.setVisibility(false)
          //this._gameOverScoresLayer.setVisibility(false)
          //this._gameOverScoresLayer.removeAllTexts()

          const players: Player[] = this._store.players()
          players.forEach((p: Player, i: number) => {
            this._dmd.removeLayer(`game-over-score-${i}`)
          })

          this._delayAttractMusic = true
          this.start(priority)

        })

      }, ATTRACT_RESTART_TIMEOUT)


      // Start attractmode
    } else {

      this._backgroundLayer.setVisibility(true)
      this._titleLayer1?.setVisibility(true)
      this._titleLayer2?.setVisibility(true)
      this._subTitleLayer?.setVisibility(true)
      this._creditsLayer?.setVisibility(true)
      this._startLayer?.setVisibility(false)
      this._blinkInterval = window.setInterval(this._toggleStartText.bind(this), 1000)

      if (this._dmd.brightness < 1) {
        this._dmd.fadeIn(150).then(() => {
          this._startAttractMusicIfNeeded()
        })
      } else {
        this._startAttractMusicIfNeeded()
      }


    }

    return true
  }


  // Update credit string
  private _onCreditsStringChanged(creditString: string) {
    this._creditsLayer?.setText(creditString)
    this._logger.log(`credit string changed to => ${creditString}`, this._creditsLayer)
  }

  private _startAttractMusicIfNeeded() {
    if (this._delayAttractMusic) {
      this._attractMusicTO = window.setTimeout(this._startAttractMusic.bind(this), ATTRACT_MUSIC_RESTART_DELAY)
      this._delayAttractMusic = false
    } else {
      this._startAttractMusic()
    }
  }

  private _startAttractMusic() {
    this._audioManager.playSound('attract', 'attract-music', false, this._onMusicEnded.bind(this))
  }

  private _toggleStartText() {
    this._startLayer?.toggleVisibility()
  }

  private _onMusicEnded() {
    if (this.isStarted()) {
      this._logger.log("onMusicEnded() : Attract music ended, restarting later")
      this._attractMusicTO = window.setTimeout(this._startAttractMusic.bind(this), ATTRACT_MUSIC_RESTART_DELAY)
    } else {
      this._logger.log("onMusicEnded() : Mode not started so I will not restart attract music")
    }
  }

  override stop() {
    super.stop()

    this._audioManager.stopSound('attract-music')

    this._backgroundLayer.setVisibility(false)
    this._titleLayer1?.setVisibility(false)
    this._titleLayer2?.setVisibility(false)
    this._subTitleLayer?.setVisibility(false)
    this._creditsLayer?.setVisibility(false)
    this._startLayer?.setVisibility(false)

    this._gameOverCloudsVideoLayer.setVisibility(false)
    this._gameOverCloudsVideoLayer.stop()

    this._gameOverCloudsLayer2.setVisibility(false)
    this._gameOverBackgroundLayer.setVisibility(false)
    this._gameOverTextLayer.setVisibility(false)

    //this._gameOverScoresLayer.setVisibility(false)
    //this._gameOverScoresLayer.removeAllTexts()


    clearTimeout(this._attractMusicTO)
    this._attractMusicTO = undefined

    clearTimeout(this._attractRestartTO)
    this._attractRestartTO = undefined

    clearInterval(this._blinkInterval)
    this._blinkInterval = undefined

    // Set variable so this attract mode knows a game was playing
    this._gameIsPlaying = true // TODO : get this from game mode maybe since base mode is always started during game
  }
}

export {AttractMode}
