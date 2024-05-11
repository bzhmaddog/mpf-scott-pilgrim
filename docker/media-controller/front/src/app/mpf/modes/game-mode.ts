import {Colors, ILayerRendererDictionary, NoiseEffectRenderer, Options, TextLayer} from "h5dmd"
import {Mode} from "@mpf/modes/mode"
import {Utils} from "@mpf/utils/utils"
import {CurrentGameState} from 'app/store/game'
import {selectCurrentGameState} from "@store/game/game.selectors";
import {Subscription} from "rxjs";

/**
 * This mode runs all the time and is responsible for updating the score / player / ball texts
 */
class GameMode extends Mode {
  private _scoreLayer!: TextLayer
  private _playerValueLayer!: TextLayer
  private _ballValueLayer!: TextLayer
  private _to: number | undefined

  private _gameStateChangedSubscription?: Subscription

  constructor() {
    super('game')
  }

  override init() {
    super.init()

    // Build array of path to noise images
    // TODO : Get from resource manager
    const noises: string[] = []
    for (let i = 0; i < 6; i++) {
      noises.push(`assets/resources/images/noises/noise-${i}.png`)
    }

    this._resourcesManager
      .getSound('start')
      .load()
      .then(audioBuffer => {
        this._audioManager.addSound('start', audioBuffer)
      })

    //this._audioManager.addSound('main', this._resourcesManager.getMusic('main').resource)

    this._dmd.addTextLayer(
      'player-text',
      {
        width: 15,
        height: 15,
        left: 0,
        vAlign: 'bottom',
      },
      new Options({
        text: this._resourcesManager.getString('playerText'),
        fontSize: 90,
        fontFamily: 'Dusty',
        color: Colors.White as string,
        strokeWidth: 2,
        strokeColor: Colors.Blue as string,
        zIndex: 1001,
        visible: false,
        groups: ['hud']
      })
    )


    this._dmd.addTextLayer(
      'ball-text',
      {
        width: 60,
        height: 15,
        hAlign: 'right',
        hOffset: -15,
        vAlign: 'bottom',
      }
      , new Options({
        text: this._resourcesManager.getString('ballText'),
        fontSize: 90,
        fontFamily: 'Dusty',
        color: Colors.White,
        strokeWidth: 2,
        strokeColor: Colors.Blue,
        zIndex: 1001,
        visible: false,
        groups: ['hud']
      })
    )


    this._playerValueLayer = this._dmd.addTextLayer(
      'player-value',
      {
        width: 10,
        height: 15,
        left: 15, // Fix %,
        vAlign: 'bottom'
      },
      new Options({
        text: "0",
        fontSize: 90,
        fontFamily: 'Dusty',
        color: Colors.White,
        strokeWidth: 2,
        strokeColor: Colors.Blue,
        visible: false,
        groups: ['hud'],
        renderers: ['score-effect']
      }),
      {"score-effect": new NoiseEffectRenderer(10, 15, 200, noises)}
    )


    this._ballValueLayer = this._dmd.addTextLayer(
      'ball-value',
      {
        width: 15,
        height: 15,
        hAlign: 'right',
        vAlign: 'bottom'
      },
      new Options({
        text: "0",
        fontSize: 90,
        fontFamily: 'Dusty',
        color: Colors.White,
        strokeWidth: 2,
        strokeColor: Colors.Blue,
        zIndex: 1001,
        aaTreshold: 144,
        antialiasing: false,
        visible: false,
        groups: ['hud'],
        renderers: ['score-effect']
      }),
      {"score-effect": new NoiseEffectRenderer(15, 15, 200, noises)}
    )

    this._scoreLayer = this._dmd.addTextLayer(
      'score',
      {},
      new Options({
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
        zIndex: 1000,
        aaTreshold: 144,
        antialiasing: false,
        visible: false,
        groups: ['hud'],
        renderers: ['score-effect']
      }),
      {"score-effect": new NoiseEffectRenderer(this._dmd.width, this._dmd.height, 200, noises)} as ILayerRendererDictionary
    )
  }

  /**
   * Update current player game data (score, ball, player
   * @param currentGameState
   * @private
   */
  private _onCurrentGameStateChanged(currentGameState: CurrentGameState) {
    this._scoreLayer.setText(Utils.formatScore(currentGameState.score))
    this._ballValueLayer.setText(currentGameState.ball.toString())
    this._playerValueLayer.setText(currentGameState.player.toString())
  }

  override start(priority: number): boolean {
    // Ugly but not sure howto do better
    if (!super.start(priority)) {
      return false
    }

    this._gameStateChangedSubscription = this._store
      .select(selectCurrentGameState)
      .subscribe((currentGameState: CurrentGameState) => this._onCurrentGameStateChanged(currentGameState))


    //this._audioManager.playSound('start', 'start-first-player-sound')

    if (this._dmd.brightness == 1) {
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

    this._gameStateChangedSubscription?.unsubscribe()

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
