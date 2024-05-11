import {WebSocketServer} from '@mpf/network/WebSocketServer'
import {CanvasLayer, Dmd, DotShape, Options} from "h5dmd";
import {ResourcesManager} from "@mpf/services/resources-manager.service";
import {inject} from "@angular/core";
import {ToastrService} from "ngx-toastr";
import {Store} from "@ngrx/store";
import {WebSocketMessageParams} from "@mpf/types"
import {machineActions} from '@store/machine'
import {gameActions} from 'app/store/game'
import {AudioManager} from "@mpf/services/audio-manager.service";
import {ModesManager} from "@mpf/services/modes-manager.service";
import {DmdManagerService} from "@mpf/services/dmd-manager.service";

export class App {
  private _wsServer: WebSocketServer
  private readonly _resourcesManager: ResourcesManager
  private readonly _audioManager: AudioManager
  private _modesManager: ModesManager
  private readonly _dmdManager: DmdManagerService
  //private _dmd: Dmd
  private readonly _toaster: ToastrService
  private readonly _store: Store

  get _dmd(): Dmd {
    return this._dmdManager.getDmd()!
  }

  constructor(canvasElement: HTMLCanvasElement) {
    this._wsServer = new WebSocketServer({
      hostname: "archpinball.dev",
      port: 4443,
      secure: true,
      onMessage: this._wsOnMessage.bind(this),
      onOpen: this._wsOnOpen.bind(this),
      onClose: this._wsOnClose.bind(this),
      onError: this._wsOnError.bind(this)
    })

    this._dmdManager = inject(DmdManagerService)
    this._resourcesManager = inject(ResourcesManager)
    this._audioManager = inject(AudioManager)

    this._toaster = inject(ToastrService)
    this._store = inject(Store)
    this._modesManager = inject(ModesManager)

    // Listen to keyboard events and send them to the backend
    document.addEventListener("keypress", (event) => {
      this._wsServer.send(`mc_keyboard_event?key=${event.key}`)
    });

    // Load resources file then reset dmd
    this._resourcesManager.load().then(resources => {

      this._dmdManager.setDmd(
        new Dmd(canvasElement, 2, 1, 1, 1, DotShape.Square, 14, 0, true)
      )

      console.log("Resources file loaded", resources)

      // Init DMD then
      this._dmd.init().then(() => {

        // Start rendering dmd
        this._dmd.run()

        // Reset the DMD (show only background layer and mpf logo)
        this._resetDMD(true)

        // Connect to backend (start the game)
        this._wsServer.connect()
      })
    })
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
    this._toaster.success('Connected...', 'Backend', {
      timeOut: 1000,
    });
  }

  private _wsOnClose() {
    if (this._wsServer.isConnected()) {
      this._reset()

      this._toaster.error('Disconnected...', 'Backend', {
        timeOut: 30000,
      });
    }
  }

  /**
   * Handle messages from web socket server
   */
  private _wsOnMessage(cmd: string, _params: { [key: string]: string }, rawData: unknown) {
    //const params = new Options(_params)
    switch (cmd) {
      case 'mc_connected':
        console.log("MPF connected")
        break
      case 'mc_hello':
        console.log("MPF says hello")
        break
      case 'mc_reset':
        console.log("MPF requested reset")

        this._dmd.fadeOut(150).then(() => {
          this._dmd.removeLayer("logo")
          this._wsServer.send('mc_ready')
        })
        break
      case 'mc_goodbye':
        console.log("MPF said goodbye")
        this._reset()
        break
      case 'mc_machine_variable':
        this._updateMachineVariables(_params)
        break
      case 'mc_player_variable':
        this._updatePlayerVariable(JSON.parse(_params['variables']))
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
        console.log('ball_end')
        // todo : Play some animation
        break

      default:
        console.log(`_wsOnMessage()[${cmd}] :`, _params, rawData)
      //console.log("Unhandled message received : ", rawData)
    }

  }

  /**
   * Reset app
   */
  private _reset() {
    //this._modesManager.stopActiveMode()
    this._resetDMD(true)
    this._audioManager.reset()
  }

  /**
   * Reset all layers and add the two default layers
   */
  private _resetDMD(initModes: boolean = false) {
    console.log("DMD reset")

    //this._audioManager.reset()

    // Remove all layers
    this._dmd.reset()

    // Add default screen (mpf logo)
    this._dmd.addCanvasLayer(
      'logo',
      {}, // use default values
      new Options({opacity: 1}),
      undefined,
      (layer) => {
        this._resourcesManager
          .getImage('logo').load()
          .then((bitmap: ImageBitmap) => {
            (layer as CanvasLayer).drawBitmap(
              bitmap,
              new Options({
                top: 0,
                left: 0,
                width: '100%', // Number of horizontal DMD dots
                height: '100%' // Number of vertical DMD dots
              })
            )
          })
          .catch(error => alert(error))
      })

    if (initModes) {
      // Init modes
      this._modesManager.initAll()
    }

    // DMD has been created with brightness = 0 so show it now
    setTimeout(this._fadeIn.bind(this), 100)
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
    this._store.dispatch(gameActions.setPlayerBall({player, ball}))
  }

  /**
   * Update player variable (score,ball, etc)
   */
  private _updatePlayerVariable(data: WebSocketMessageParams) {

    switch(data['name']) {
      case 'index': {
        const player: number = parseInt(data['value'], 10)
        console.log(`_updatePlayerVariable[index]`, player)
        if (player > 0) { //TODO Check end of game
          this._store.dispatch(gameActions.setCurrentPlayer({player}))
        }
        break
      }
      case 'score': {
        const player: number = parseInt(data['player_num'], 10)
        const score: number = parseInt(data['value'], 10)
        console.log(`_updatePlayerVariable[score]`, player, score)
        this._store.dispatch(gameActions.setPlayerScore({player, score}))
        break
      }
      case 'ball': {
        const player: number = parseInt(data['player_num'], 10)
        const ball: number = parseInt(data['value'], 10)
        console.log(`_updatePlayerVariable[ball]`, player, ball)
        this._store.dispatch(gameActions.setPlayerBall({player, ball}))
        break
      }
      case 'number': {
        console.log(data)
        const players: number = parseInt(data['value'], 10)
        this._store.dispatch(gameActions.setCurrentNumberOfPlayers({players}))

        // Does nothing because number of players is the length of players array
        break
      }
      default:
        console.log('_updatePlayerVariable(): Unhandled case', data);
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
      } catch (error) {
        value = v
      }
      this._store.dispatch(machineActions.setMachineVariable({key, value}))
    }
  }

  private _addPlayer() {
    this._store.dispatch(gameActions.addPlayer())
  }

  private _playerTurnStart(player: number) {
    this._store.dispatch(gameActions.setCurrentPlayer({player}))
  }
}
