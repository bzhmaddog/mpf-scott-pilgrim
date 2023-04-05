import { AudioManager } from "../managers/AudioManager.js"
import { ResourcesManager } from "../managers/ResourcesManager.js"
import { VariablesManager } from "../managers/VariablesManager.js"
import { DMD } from "../dmd/DMD.js"

abstract class Mode {
    private _isStarted = false
    private _priority = 0
    private _isInitialized = false
    protected _audioManager: AudioManager
    protected _dmd: DMD
    protected _variablesManager: VariablesManager
    protected _resourcesManager: ResourcesManager
    private _name: string


    constructor(name: string, _dmd: DMD, _resourcesManager: ResourcesManager, _variables: VariablesManager, _audioManager: AudioManager) {
        this._name = name
        this._dmd = _dmd
        this._variablesManager = _variables
        this._resourcesManager = _resourcesManager
        this._audioManager = _audioManager
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
        this._isInitialized = true
        this._isStarted = false
    }
    
    get name(): string {
        return this._name
    }

    get priority(): number{
        return this._priority
    }
}

export { Mode }