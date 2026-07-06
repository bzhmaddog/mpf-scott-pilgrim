import {Colors, NoiseEffectRenderer, rendererEntry, TextLayer, Utils} from "h5dmd"
import {Mode} from "@mpf/modes/mode"
import {GameStore} from "../../store/game.store";
import {effect, inject} from "@angular/core";


/**
 * This mode runs all the time and is responsible for updating the score / player / ball texts
 */
class GameMode extends Mode {
  private _scoreLayer?: TextLayer
  private _playerValueLayer?: TextLayer
  private _ballValueLayer?: TextLayer
  private _to: number | undefined

  private readonly _store = inject(GameStore)

  private playerValueEffect =
    effect(() => {
      const currentPlayer = this._store.player()
      if (this.isStarted()) this._playerValueLayer?.setText(currentPlayer.toString())
    })

  private ballValueEffect =
    effect(() => {
      const currentBallValue = this._store.currentPlayerState().ball
      if (this.isStarted()) this._ballValueLayer?.setText(currentBallValue.toString())
    })

  private scoreValueEffect =
    effect(() => {
      const currentScoreValue = this._store.currentPlayerState().score
      if (this.isStarted()) this._scoreLayer?.setText(currentScoreValue.toString())
    })


  constructor() {
    super('game')
  }

  override async init() {
    super.init()

    // Build array of path to noise images
    // TODO : Get from resource manager
    const noisePaths: string[] = []
    for (let i = 0; i < 6; i++) {
      noisePaths.push(`assets/resources/images/noises/noise-${i}.png`)
    }

    this._resourcesManager
      .getSound('start')
      .load()
      .then(audioBuffer => {
        this._audioManager.addSound('start', audioBuffer)
      })

    //this._audioManager.addSound('main', this._resourcesManager.getMusic('main').resource)

    this._dmd.addLayer(
      TextLayer,
      'player-text',
      {
        width: 15,
        height: 15,
        position: {
          left: 0,
          vAlign: 'bottom',
        },
        left: 0,
        vAlign: 'bottom',
        text: this._resourcesManager.getString('playerText'),
        fontSize: 90,
        fontFamily: 'Dusty',
        color: Colors.White as string,
        strokeWidth: 2,
        strokeColor: Colors.Blue as string,
        visible: false,
        groups: ['hud']
      }
    )


    this._dmd.addLayer(
      TextLayer,
      'ball-text',
      {
        width: 60,
        height: 15,
        position: {
          hAlign: 'right',
          hOffset: -15,
          vAlign: 'bottom',
        },
        hAlign: 'right',
        hOffset: -15,
        vAlign: 'bottom',
        text: this._resourcesManager.getString('ballText'),
        fontSize: 90,
        fontFamily: 'Dusty',
        color: Colors.White,
        strokeWidth: 2,
        strokeColor: Colors.Blue,
        visible: false,
        groups: ['hud']
      }
    )

    // NoiseEffectRenderer now takes pre-loaded pixel data instead of image paths
    const noiseBitmaps = await Utils.loadImagesOrdered(noisePaths)

    this._playerValueLayer = this._dmd.addLayer(
      TextLayer,
      'player-value',
      {
        width: 10,
        height: 15,
        position: {
          left: 15,
          vAlign: 'bottom',
        },
        left: 15, // Fix %,
        vAlign: 'bottom',
        text: "0",
        fontSize: 90,
        fontFamily: 'Dusty',
        color: Colors.White,
        strokeWidth: 2,
        strokeColor: Colors.Blue,
        visible: false,
        groups: ['hud'],
        renderers: [
          rendererEntry('score-effect', NoiseEffectRenderer, {
            duration: 200,
            noises: Utils.bitmapsToPixelData(noiseBitmaps, 10, 15)
          })
        ]
      }
    )


    this._ballValueLayer = this._dmd.addLayer(
      TextLayer,
      'ball-value',
      {
        width: 15,
        height: 15,
        position: {
          hAlign: 'right',
          vAlign: 'bottom',
        },
        hAlign: 'right',
        vAlign: 'bottom',
        text: "0",
        fontSize: 90,
        fontFamily: 'Dusty',
        color: Colors.White,
        strokeWidth: 2,
        strokeColor: Colors.Blue,
        visible: false,
        groups: ['hud'],
        renderers: [
          rendererEntry('score-effect', NoiseEffectRenderer, {
            duration: 200,
            noises: Utils.bitmapsToPixelData(noiseBitmaps, 15, 15)
          })
        ]
      }
    )

    this._scoreLayer = this._dmd.addLayer(
      TextLayer,
      'score',
      {
        text: "0",
        fontSize: 40,
        fontFamily: 'Dusty',
        hAlign: 'right',
        hOffset: -1,
        vAlign: 'middle',
        color: Colors.White,
        outlineWidth: 2,
        outlineColor: Colors.Blue,
        adjustWidth: true,
        antialiasing: false,
        visible: false,
        groups: ['hud'],
        renderers: [
          rendererEntry('score-effect', NoiseEffectRenderer, {
            duration: 200,
            noises: Utils.bitmapsToPixelData(noiseBitmaps, this._dmd.width, this._dmd.height)
          })
        ]
      }
    )
  }

  override start(priority: number): boolean {
    // Ugly but not sure howto do better
    if (!super.start(priority)) {
      return false
    }

    //this._audioManager.playSound('start', 'start-first-player-sound')

    if (this._dmd.brightness === 1) {
      this._dmd.fadeOut(150).then(() => {


        this._dmd.setLayerGroupVisibility('hud', true)

        this._resourcesManager
          .getMusic('main')
          .load()
          .then(audioBuffer => {
            this._audioManager.addSound('main', audioBuffer)
            setTimeout(this._startMainMusic.bind(this), 1000)
          })
          .catch(error => {
            throw Error(`getMusic("main").load() failed : ${error}`)
          })

        this._dmd.fadeIn(150)
      })

    }

    return true
  }

  override stop() {
    super.stop()

    this._audioManager.stopSound('main-music')

    this._dmd.setLayerGroupVisibility('hud', false)

    //this._store.dispatch(gameActions.resetGameState())

    clearTimeout(this._to)
    //this._audioManager.playSound('gameover', 'gameover-sound')
  }

  private _startMainMusic() {
    this._audioManager.playSound('main', 'main-music', true)
  }
}

export {GameMode}
