import {WebSocketServer} from '@mpf/network/WebSocketServer'
import {BaseLayer, CanvasLayer, Dmd, DotShape, TextLayer} from "h5dmd";
import {ResourcesManager} from "@mpf/services/resources-manager.service";
import {inject} from "@angular/core";
import {WebSocketMessageParams} from '@mpf/models'
import {AudioManager} from "@mpf/services/audio-manager.service";
import {ModesManager} from "@mpf/services/modes-manager.service";
import {DmdManagerService} from "@mpf/services/dmd-manager.service";
import {GameStore} from "../store/game.store";
import {AppColors} from "./utils/utils";
import {Logger} from "../utils/logger";

export class MpfApp {
  private readonly _wsServer: WebSocketServer
  private readonly _resourcesManager: ResourcesManager = inject(ResourcesManager)
  private readonly _audioManager: AudioManager = inject(AudioManager)
  private readonly _modesManager: ModesManager = inject(ModesManager)
  private readonly _dmdManager: DmdManagerService = inject(DmdManagerService)
  private readonly _logger = inject(Logger).getInstance('App')

  private readonly _store = inject(GameStore)


  get _dmd(): Dmd {
    const dmd = this._dmdManager.getDmd()
    if (!dmd) throw new Error('DMD not initialized')
    return dmd
  }

  constructor(canvasElement: HTMLCanvasElement) {
    this._wsServer = new WebSocketServer({
      hostname: "archpinball.dev",
      port: 4443,
      path: '/ws',
      secure: true,
      onMessage: this._wsOnMessage.bind(this),
      onOpen: this._wsOnOpen.bind(this),
      onClose: this._wsOnClose.bind(this),
      onError: this._wsOnError.bind(this)
    })

    this._init(canvasElement)
  }

  handleKeyEvent(event: KeyboardEvent): void {
    if (!this._wsServer.isConnected()) {
      this._logger.warn("Websocket server is not connected")
      return;
    }
    this._wsServer.send(`mc_keyboard_event?key=${event.key}`)
  }

  private async _init(canvasElement: HTMLCanvasElement): Promise<void> {
    // Load resources file then reset dmd
    const resources = await this._resourcesManager.load()

    this._logger.log("Resources file loaded", resources)

    this._dmdManager.setDmd(
      new Dmd(canvasElement, {
        dotSize: 2,
        dotSpace: 1,
        dotShape: DotShape.Square,
        backgroundBrightness: 14,
        brightness: 0,
        showFPS: true
      })
    )

    // Init DMD then
    await this._dmd.init()

    this._logger.log(`DMD(v${this._dmd.version}) initialized`)

    // Start rendering dmd
    this._dmd.run()

    // Reset the DMD (show only background layer and mpf logo)
    this._resetDMD()

    // Connect to backend (start the game)
    this._wsServer.connect()
  }

  private _wsOnError(event: Event) {
    if (this._wsServer.isConnected()) {
      this._wsServer.close()
    } else {
      if ((event.target as WebSocket).readyState === 3) {
        setTimeout(() => {
          this._wsServer.connect()
        }, 1500)
      }
    }
  }

  private _wsOnOpen() {
    this._showToast('Connected...', 1000)
  }

  private _wsOnClose() {
    if (this._wsServer.isConnected()) {
      this._resetDMD()
      this._showToast('Disconnected...')
    }
  }

  /**
   * Handle messages from web socket server
   */
  private _wsOnMessage(cmd: string, _params: { [key: string]: string }, rawData: unknown) {
    //const params = new Options(_params)
    switch (cmd) {
      case 'mc_connected':
        this._logger.log("MPF connected")
        break
      case 'mc_hello':
        this._logger.log("MPF says hello")
        break
      case 'mc_reset':
        this._logger.log("MPF requested reset")
        this._dmd.fadeOut(150).then(() => {
          this._dmd.removeLayer("logo")

          this._dmd.fadeIn(150).then(() => {
            this._modesManager.initAll()
            this._audioManager.reset()

            this._wsServer.send('mc_ready')
          })
        })
        break
      case 'mc_settings':
        this._logger.log("MPF sent settings")
        try {
          this._store.setSettings(JSON.parse(_params["settings"]))
        } catch (error) {
          this._logger.error(`Failed to parse mc_settings payload: ${error}`)
        }
        break
      case 'mc_goodbye':
        this._logger.log("MPF said goodbye")
        this._resetDMD()
        break
      case 'mc_machine_variable':
        this._logger.log("MPF sent machine variables")
        this._updateMachineVariables(_params)
        break
      case 'mc_player_variable':
        this._logger.log("MPF sent player variables")
        try {
          this._updatePlayerVariable(JSON.parse(_params['variables']))
        } catch (error) {
          this._logger.error(`Failed to parse mc_player_variable payload: ${error}`)
        }
        break
      case 'mc_mode_start':
        this._modesManager.startMode(
          _params['name'],
          parseInt(_params['priority'], 10)
        )
        break
      case 'mc_mode_stop':
        this._modesManager.stopMode(_params['name'])
        break
      case 'mc_player_added':
        this._addPlayer()
        break
      case 'mc_player_turn_start':
        this._playerTurnStart(
          parseInt(_params['player_num'], 10)
        )
        break
      case 'mc_ball_start':
        this._ballStart(
          parseInt(_params['player_num'], 10),
          parseInt(_params['ball'], 10)
        )
        break
      case 'mc_ball_end':
        this._logger.log('ball_end')
        // todo : Play some animation
        break
      case 'mc_switch':
        this._logger.log("BCP Switches", _params, rawData)
        break
      default:
        this._logger.log(`_wsOnMessage()[${cmd}] :`, _params, rawData)
      //console.log("Unhandled message received : ", rawData)
    }

  }

  /**
   * Reset app
   */
  private _reset() {
    //this._modesManager.stopActiveMode()
    this._resetDMD().then(() => {
      this._modesManager.initAll();
    })
    this._audioManager.reset()
  }

  /**
   * Reset all layers and add the two default layers
   */
  private _resetDMD(): Promise<void> {
    this._logger.log("Reseting DMD")

    return new Promise((resolve) => {

      // Remove all layers
      this._dmd.reset()

      // Add default screen (mpf logo)
      this._dmd.addLayer(
        CanvasLayer,
        'logo',
        {opacity: 1}, // use default values
        (layer) => {
          this._resourcesManager
            .getImage('logo').load()
            .then((bitmap: ImageBitmap) => {
              layer.drawBitmap(
                bitmap,
                {
                  top: 0,
                  left: 0
                }
              )
            })
            .catch(error => this._showToast(String(error)))
        }
      )

      this._dmd.addLayer(
        TextLayer,
        "ws-toast",
        {
          text: '...',
          fontSize: 8,
          fontFamily: 'Arial',
          left: 0,
          top: 1,
          color: AppColors.Green,
          strokeWidth: 2,
          strokeColor: AppColors.DarkGreen,
          visible: false,
          opacity: 0,
          hAlign: 'left',
          vAlign: 'top',
          groups: ['toasts']
        }
      );

      // DMD has been created with brightness = 0 so show it now
      this._timer(100).then(() => {
        this._fadeIn()
        resolve()
      })
    })

  }

  private _timer(delay: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, delay);
    });
  }

  private _showToast(text: string, duration = 3000) {
    const toastLayer = this._dmd.getLayer('ws-toast') as TextLayer | null
    if (toastLayer) {
      toastLayer.setText(text)
      toastLayer.setOpacity(0)
      toastLayer.setVisibility(true)
      this._fadeLayer(toastLayer, 0, 1, 300).then(() => {
        this._timer(duration).then(() => {
          this._fadeLayer(toastLayer, 1, 0, 300).then(() => {
            toastLayer.setVisibility(false)
          })
        })
      })
    }
  }

  private _fadeLayer(layer: BaseLayer, from: number, to: number, duration: number): Promise<void> {
    return new Promise((resolve) => {
      const start = performance.now()
      layer.setOpacity(from)

      const step = () => {
        const elapsed = performance.now() - start
        const progress = Math.min(elapsed / duration, 1)
        layer.setOpacity(from + (to - from) * progress)

        if (progress < 1) {
          requestAnimationFrame(step)
        } else {
          resolve()
        }
      }

      requestAnimationFrame(step)
    })
  }

  /**
   * Fade DMD from {current brightness} to 1
   */
  private _fadeIn() {
    this._dmd.fadeIn(1000)
  }

  /**
   * Update ball number for playerNum
   * @param {number} player
   * @param {number} ball
   */

  private _ballStart(player: number, ball: number) {
    this._store.setPlayerBall(player, ball)
  }

  /**
   * Update player variable (score,ball, etc)
   */
  private _updatePlayerVariable(data: WebSocketMessageParams) {

    switch(data['name']) {
      case 'index': {
        const player: number = parseInt(data['value'], 10)
        this._logger.log(`IGNORED : _updatePlayerVariable[index]`, player)
        //if (player > 0) { //TODO Check end of game
          //this._store.setCurrentPlayer(player)
        //}
        break
      }
      case 'score': {
        const player: number = parseInt(data['player_num'], 10)
        const score: number = parseInt(data['value'], 10)
        this._logger.log(`_updatePlayerVariable[score]`, player, score)
        this._store.setPlayerScore(player, score)
        break
      }
      case 'ball': {
        const player: number = parseInt(data['player_num'], 10)
        const ball: number = parseInt(data['value'], 10)
        this._logger.log(`_updatePlayerVariable[ball]`, player, ball)
        this._store.setPlayerBall(player, ball)
        break
      }
      case 'number': {
        const n: number = parseInt(data['value'], 10)
        this._logger.log("_updatePlayerVariable[number] =>", n)
        this._store.setCurrentPlayer(n)
        break
      }
      default:
        this._logger.log('_updatePlayerVariable(): Unhandled case', data);
    }
  }

  /**
   * Update multiple machine variables at a time
   */
  private _updateMachineVariables(params: WebSocketMessageParams) {
    for (const [key, v] of Object.entries(params)) {
      let value

      try {
        value = JSON.parse(v as string)
      } catch {
        value = v
      }
      this._store.setMachineVariable(key, value)
    }
  }

  private _addPlayer() {
    this._logger.log("Player added")
    this._store.addPlayer()
  }

  private _playerTurnStart(player: number) {
    this._store.setCurrentPlayer(player)
  }
}
