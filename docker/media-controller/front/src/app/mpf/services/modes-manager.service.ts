import {Inject, Injectable} from "@angular/core";
import {Mode} from "@mpf/modes/mode"
import {modesManager} from "@mpf/services/types";


interface IModesDictionary {
  [index: string]: Mode
}

export interface IModesConfigDictionary {
  [key: string]: () => Mode
}

@Injectable({
  providedIn: 'root'
})
class ModesManager {
  private _modes: IModesDictionary
  private _activeMode?: Mode

  constructor(@Inject(modesManager) availableModes: IModesConfigDictionary) {
    this._modes = {}
    this._activeMode = undefined // typeof null === object so break stopActiveMode

    Object.keys(availableModes).forEach((name: string) => {
      this._modes[name] = availableModes[name]();
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
      console.log(`Mode [${name}] does not exists`)
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

export {ModesManager}
