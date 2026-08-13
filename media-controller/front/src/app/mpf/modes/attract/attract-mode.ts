import {CanvasLayer, Colors, LayerGroup, TextLayer, VideoLayer} from 'h5dmd'
import {Mode} from "@mpf/core/mode";
import {Utils} from "@mpf/utils/utils";
import {computed, inject, Signal} from "@angular/core";
import {GameStore} from "../../../store/game.store";
import {Player} from "@models/player";

const ATTRACT_MUSIC_RESTART_DELAY = 30000
const ATTRACT_RESTART_TIMEOUT = 30000 * 2 * 5 // TODO Change

class AttractMode extends Mode {
  private _blinkInterval: number | undefined // WTF
  private _attractRestartTO: number | undefined
  private _attractMusicTO: number | undefined
  
  private _attractSceneGroup?: LayerGroup
  private _gameOverSceneGroup?: LayerGroup

  private _startLayer?: TextLayer
  private _creditsLayer?: TextLayer

  private _gameOverCloudsVideoLayer!: VideoLayer
  
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

    // Create hidden groups
    this._attractSceneGroup = this._dmd.addLayerGroup('attract-scene', { visible: false })
    this._gameOverSceneGroup = this._dmd.addLayerGroup('gameover-scene', { visible: false })


    this._attractSceneGroup.addLayer(
      CanvasLayer,
      'attract-background',
      {},
      layer => this._resourcesManager.getImage('title').load().then(bitmap => layer.drawBitmap(bitmap))
    )

    const titleGroup = this._attractSceneGroup.addLayerGroup(
      'attract-title',
      {
        width: 195,
        height: 118, //  Total height of title1 + title2 + subtitle
        position: {
          hAlign: 'end',
          vAlign: 'start',
          hOffset: -10,
        }
      }
    )

    titleGroup.addLayer(
      TextLayer,
      'attract-title-scott',
      {
        height: 50,
        position: { vAlign: 'start' },
        text: 'SCOTT',
        fontSize: 90,
        fontFamily: 'Superfly',
        hAlign: 'start',
        vAlign: 'end',
        vOffset: 2,
        color: Colors.Blue,
        strokeWidth: 2,
        strokeColor: Colors.White
      }
    )

    titleGroup.addLayer(
      TextLayer,
      'attract-title-pilgrim',
      {
        height: 50,
        position: { vAlign: 'constraint', topToBottomOf: 'attract-title-scott' },
        text: 'PILGRIM',
        fontSize: 90,
        fontFamily: 'Superfly',
        hAlign: 'start',
        vAlign: 'start',
        color: Colors.Blue,
        strokeWidth: 2,
        strokeColor: Colors.White
      }
    )

    titleGroup.addLayer(
      TextLayer,
      'attract-subtitle',
      {
        width: 178,
        height: 18,
        position: {
          vAlign: 'constraint',
          topToBottomOf: 'attract-title-pilgrim'
        },
        hAlign: 'start',
        vAlign: 'start',
        hOffset: 2,
        text: 'VS. THE WORLD',
        fontSize: 50,
        fontFamily: 'Dusty',
        color: Colors.Red
      }
    )


    this._startLayer = this._attractSceneGroup.addLayer(
      TextLayer,
      'attract-start',
      {
        width: 150,
        height: 16,
        position: {
          hAlign: 'center',
          vAlign: 'end'
        },
        text: startString,
        fontSize: 70,
        fontFamily: 'Dusty',
        hAlign: 'center',
        vAlign: 'end',
        vOffset: -2,
        strokeWidth: 2,
        strokeColor: Colors.Red,
        visible: false
      }
    )

    this._creditsLayer = this._attractSceneGroup.addLayer(
      TextLayer,
      'attract-credits',
      {
        width: 65,
        height: 10,
        position: {
          hAlign: 'end',
          vAlign: 'end',
        },
        hAlign: 'center',
        vAlign: 'center',
        text: this.creditString() ?? initialCreditString,
        fontSize: 60,
        fontFamily: 'Dusty',
        color: Colors.White
      }
    )


    // TODO : Load video in callback
    this._gameOverCloudsVideoLayer = this._gameOverSceneGroup.addLayer(
      VideoLayer,
      'gameover-clouds-moving',
      {
        autoplay: false,
        loop: true
      },
      (layer) => {
        this._resourcesManager
          .getVideo('gameover-clouds')
          .load()
          .then(videoElement => {
            layer.setVideo(videoElement)
          })
      }
    )

    this._gameOverSceneGroup.addLayer(
      CanvasLayer,
      'gameover-clouds-static',
      {
      },
      (layer) => {
        this._resourcesManager
          .getImage('gameover-clouds')
          .load()
          .then(bitmap => {
            layer.drawBitmap(bitmap, {})
          })
      }
    )


    this._gameOverSceneGroup.addLayer(
      CanvasLayer,
      'gameover-bg',
      {
      },
      (layer) => {
        this._resourcesManager
          .getImage('gameover-bg')
          .load()
          .then(bitmap => {
            layer.drawBitmap(bitmap, {})
          })
      }
    )

      this._gameOverSceneGroup.addLayer(
      TextLayer,
      'gameover-text',
      {
        text: goString,
        fontSize: '20',
        fontFamily: 'Dusty',
        hAlign: 'center',
        top: 1,
        outlineWidth: 1,
        outlineColor: Colors.Red,
        antialiasing: false,
        opacity: 0.8,
        visible: false
      }
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

        this._gameOverSceneGroup?.setVisibility(true)
        this._gameOverCloudsVideoLayer.play()


        this._dmd.fadeIn(150).then(() => {

          const players: Player[] = this._store.players()

          let top = (players.length - 1) * 3 * -1 + 5
          let timeout = 0

          players.forEach((p: Player, i: number) => { // TODO Check Any

            window.setTimeout(() => {
              const score = Utils.formatScore(p.score)
              const pTxt = this._resourcesManager.getString('playerTextLong') + ` ${i + 1}`

              this._dmd.addLayer(
                TextLayer,
                `game-over-score-${i}`,
                {
                  text: `${pTxt} : ${score.toString()}`,
                  fontSize: '10',
                  fontFamily: 'Dusty',
                  left: 50,
                  vAlign: 'center',
                  vOffset: top
                }
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
          if (!this.isStarted()) return

          this._gameOverCloudsVideoLayer.stop()
          this._gameOverSceneGroup?.setVisibility(false)

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

      this._attractSceneGroup?.setVisibility(true)

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

    this._gameOverCloudsVideoLayer.stop()

    this._attractSceneGroup?.setVisibility(false)
    this._gameOverSceneGroup?.setVisibility(false)

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
