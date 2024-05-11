import {Dmd} from "h5dmd"
import {inject} from "@angular/core";
import {AudioManager} from "@mpf/services/audio-manager.service";
import {ResourcesManager} from "@mpf/services/resources-manager.service";
import {Store} from "@ngrx/store";
import {DmdManagerService} from "@mpf/services/dmd-manager.service";

export abstract class Mode {
  private _isStarted = false
  private _priority = 0
  private _isInitialized = false
  private readonly _name: string

  protected readonly _dmdManager: DmdManagerService
  protected readonly _resourcesManager: ResourcesManager
  protected readonly _audioManager: AudioManager
  protected readonly _store: Store

  protected get _dmd(): Dmd {
    return this._dmdManager.getDmd()!
  }

  protected constructor(name: string) {
    this._name = name
    this._dmdManager = inject(DmdManagerService)
    this._resourcesManager = inject(ResourcesManager)
    this._audioManager = inject(AudioManager)
    this._store = inject(Store)
  }

  start(priority: number): boolean {
    if (this._isInitialized) {
      this._isStarted = true
      this._priority = priority
      console.log(`Starting ${this.name} mode with priority ${priority}`)
      return true
    } else {
      console.log(`Mode '${this.name}' is not initialized !`)
      return false
    }
  }

  stop() {
    if (!this._isStarted) {
      console.log(`${this.name} mode is not started`)
      return
    }

    console.log(`Stopping ${this.name} mode`)

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
    console.log(`Init Mode => ${this._name}`)

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
