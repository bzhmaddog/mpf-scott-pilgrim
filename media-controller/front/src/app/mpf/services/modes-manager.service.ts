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

  initAll() {
    Object.keys(this._modes).forEach(key => {
      this._modes[key].init()
    })
  }

}
