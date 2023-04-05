import { Mode } from "../modes/Mode"

interface IModesDictionnary {
    [index: string]: Mode
}

class ModesManager {
    private _modes: IModesDictionnary
    private _activeMode: Mode

    constructor() {
        this._modes = {}
        this._activeMode = undefined // typeof null === object so break stopActiveMode
    }
    

    get activeMode(): Mode {
        return this._activeMode
    }

    add(name: string, mode: Mode) {
        if (!this._modes.hasOwnProperty(name)) {
            this._modes[name] = mode
            //console.log(`Added mode [${name}]`, mode)
        } else {
            console.log(`Mode ${name} already exists`)
        }
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
        var that = this
        Object.keys(this._modes).forEach(key => {
            that._modes[key].init()
        })
    }

}

export { ModesManager }