import {inject, Service} from "@angular/core";
import {Mode} from "@mpf/core/mode"
import {modesManager} from "@mpf/services";
import {Logger} from "../../utils/logger";
import {IModesConfigDictionary} from '@mpf/models';


interface IModesDictionary {
  [index: string]: Mode
}


@Service()
export class ModesManager {
  private readonly _availableModes = inject<IModesConfigDictionary>(modesManager);
  private readonly _logger = inject(Logger).getInstance('ModesManager');
  private _modes: IModesDictionary
  private _activeMode?: Mode

  constructor() {
    this._modes = {}
    this._activeMode = undefined // typeof null === object so break stopActiveMode

    Object.keys(this._availableModes).forEach((name: string) => {
      this._modes[name] = this._availableModes[name]();
    })
  }

  get activeMode(): Mode | undefined {
    return this._activeMode
  }

  stopActiveMode() {
    if (typeof this._activeMode === 'object') {
      this._activeMode.stop()
    }
  }

  startMode(name: string, priority: number) {
    //this.stopActiveMode()

    if (typeof this._modes[name] !== 'undefined') {
      this._activeMode = this._modes[name]
      this._activeMode.start(priority)
    } else {
      this._logger.log(`Mode [${name}] does not exists`)
    }
  }

  stopMode(name: string) {
    if (typeof this._modes[name] !== 'undefined') {
      this._modes[name].stop()
    }
  }

  getMode(key: string): Mode {
    return this._modes[key] || undefined
  }

  /**
   * Initialize every mode. Resolves once all (possibly async) inits settled;
   * a failing mode is logged and does not prevent the others from initializing.
   */
  async initAll(): Promise<void> {
    const names = Object.keys(this._modes)
    const results = await Promise.allSettled(
      names.map(async name => this._modes[name].init())
    )
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        this._logger.error(`Mode [${names[i]}] init failed`, result.reason)
      }
    })
  }

}
