import {Colors, LayerGroup, NoiseEffectRenderer, rendererEntry, TextLayer, SpritesLayer, Utils} from "h5dmd"
import {Mode} from "@mpf/core/mode"
import {GameStore} from "@store/game.store";
import {effect, inject} from "@angular/core";


/**
 * This mode runs all the time and is responsible for updating the score / player / ball texts
 */
class GameMode extends Mode {
  private _scoreLayer?: TextLayer
  private _playerValueLayer?: TextLayer
  private _ballValueLayer?: TextLayer
  private _hudLayerGroup!: LayerGroup
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

    const startSound = await this._resourcesManager.getSound('start').load()
    
    this._audioManager.addSound('start', startSound)

    // NoiseEffectRenderer now takes pre-loaded pixel data instead of image paths
    const noiseBitmaps = await Utils.loadImagesOrdered(noisePaths)

    this._hudLayerGroup = this._dmd.addLayerGroup(
      'hud',
      {
        visible: false
      }
    )

    const playerGroup = this._hudLayerGroup.addLayerGroup(
      'player',
      {
        width: 25,
        height: 15,
        position: {
          hAlign: 'start',
          vAlign: 'end',
          }
      }
    )

    const ballGroup = this._hudLayerGroup.addLayerGroup(
      'ball',
      {
        width: 35,
        height: 15,
        position: {
          hAlign: 'end',
          vAlign: 'end',
        }
      }
    )

    playerGroup.addLayer(
      SpritesLayer,
      'player-face',
      {
        width: 15,
        height: 15,
        position: {
          hAlign: 'start',
          vAlign: 'end',
        },
      },async (layer) => {
        const sheet = await this._resourcesManager.getImage('scott-face').load();

        // Sheet holds 256x256 frames but the layer is 15x15: rescale the whole
        // sheet once so frames land on the DMD grid 1:1 (h5dmd never scales)
        const scale = 15 / 256
        const bitmap = await createImageBitmap(sheet, {
          resizeWidth: Math.round(sheet.width * scale),
          resizeHeight: Math.round(sheet.height * scale),
          resizeQuality: 'high',
        })

        await layer.createSprite(
          'scott-face',
          bitmap,
          0,
          0,
          [
            {
              key: "idle",
              animationParams: {
                nbFrames: 6,
                width: 15,
                height: 15,
                xOffset: 0,
                yOffset: 0,
                duration: 1500
              }
            }
          ],
          '0',
          '0'
        )

        layer.enqueueSequence('scott-face', [{key: 'idle', nbLoop: 0}], true)
        layer.run('scott-face')
      }
    )


    ballGroup.addLayer(
      SpritesLayer,
      'ball-sprite',
      {
        width: 15,
        height: 15,
        position: {
          hAlign: 'start',
          vAlign: 'end',
        },
        opacity: 0.9,
      },async (layer) => {
        const sheet = await this._resourcesManager.getImage('sprite-ball').load();

        // Sheet holds 20x20 frames but the layer is 15x15: rescale the whole
        // sheet once so frames land on the DMD grid 1:1 (h5dmd never scales)
        const scale = 15 / 20
        const bitmap = await createImageBitmap(sheet, {
          resizeWidth: Math.round(sheet.width * scale),
          resizeHeight: Math.round(sheet.height * scale),
          resizeQuality: 'pixelated',
        })

        await layer.createSprite(
          'rolling-ball',
          bitmap,
          0,
          0,
          [
            {
                key: "idle",
                animationParams: {
                    nbFrames: 12,
                    width: 15,
                    height: 15,
                    xOffset: 0,
                    yOffset: 0,
                    duration: 900
                }
              }
          ],
          '0',
          '0'
        )

        layer.enqueueSequence('rolling-ball', [{key: 'idle', nbLoop: 0}], true)
        layer.run('rolling-ball')
      }
    )


    this._playerValueLayer = playerGroup.addLayer(
      TextLayer,
      'player-value',
      {
        width: 10,
        height: 15,
        position: {
          hAlign: 'constraint',
          leftToRightOf: 'player-face',
          vAlign: 'end',
        },
        vAlign: 'center',
        text: "0",
        fontSize: 50,
        fontFamily: 'Dusty',
        color: Colors.White,
        strokeWidth: 2,
        strokeColor: Colors.Yellow
      }
    )


    this._ballValueLayer = ballGroup.addLayer(
      TextLayer,
      'ball-value',
      {
        width: 15,
        height: 15,
        position: {
          hAlign: 'constraint',
          leftToRightOf: 'ball-sprite',
          vAlign: 'end',
        },
        hAlign: 'end',
        vAlign: 'center',
        text: "0",
        fontSize: 50,
        fontFamily: 'Dusty',
        color: Colors.White,
        strokeWidth: 2,
        strokeColor: Colors.Yellow
      }
    )

    this._scoreLayer = this._hudLayerGroup.addLayer(
      TextLayer,
      'score',
      {
        text: "0",
        fontSize: 40,
        fontFamily: 'Dusty',
        hAlign: 'end',
        hOffset: -1,
        vAlign: 'center',
        color: Colors.White,
        outlineWidth: 2,
        outlineColor: Colors.Blue,
        adjustWidth: true,
        antialiasing: false,
        visible: true,
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


        this._hudLayerGroup.setVisibility(true)

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

    this._hudLayerGroup.setVisibility(false)

    //this._store.dispatch(gameActions.resetGameState())

    clearTimeout(this._to)
    //this._audioManager.playSound('gameover', 'gameover-sound')
  }

  private _startMainMusic() {
    this._audioManager.playSound('main', 'main-music', true)
  }
}

export {GameMode}
