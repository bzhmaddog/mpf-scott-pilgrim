import {Dmd} from "h5dmd"
import {inject} from "@angular/core";
import {AudioManager} from "@mpf/services/audio-manager.service";
import {ResourcesManager} from "@mpf/services/resources-manager.service";
import {DmdManagerService} from "@mpf/services/dmd-manager.service";
import {Logger, TaggedLogger} from "@utils/logger";


export abstract class Mode {
  private _isStarted = false
  private _priority = 0
  private _isInitialized = false
  private readonly _name: string

  protected readonly _dmdManager: DmdManagerService = inject(DmdManagerService)
  protected readonly _resourcesManager: ResourcesManager = inject(ResourcesManager)
  protected readonly _audioManager: AudioManager = inject(AudioManager)
  
  protected readonly _logger: TaggedLogger


  protected get _dmd(): Dmd {
    const dmd = this._dmdManager.getDmd()
    if (!dmd) throw new Error('DMD not initialized')
    return dmd
  }

  protected constructor(name: string) {
    this._name = name
    this._logger = inject(Logger).getInstance(`Mode:${name}`)
  }

  start(priority: number): boolean {
    if (this._isInitialized) {
      this._isStarted = true
      this._priority = priority
      this._logger.info(`Starting ${this.name} mode with priority ${priority}`)
      return true
    } else {
      this._logger.warn(`Mode '${this.name}' is not initialized !`)
      return false
    }
  }

  stop() {
    if (!this._isStarted) {
      this._logger.warn(`${this.name} mode is not started`)
      return
    }

    this._logger.info(`Stopping ${this.name} mode`)

    this._isStarted = false
  }

  //abstract update: Function // abstract ?

  isStarted(): boolean {
    return this._isStarted
  }

  isInitialized(): boolean {
    return this._isInitialized
  }

  init() {
    this._logger.info(`Init Mode => ${this._name}`)

    this._isInitialized = true
    this._isStarted = false
  }

  get name(): string {
    return this._name
  }

  get priority(): number {
    return this._priority
  }
}
