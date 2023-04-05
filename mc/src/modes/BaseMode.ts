import { Mode } from "./Mode.js"
import { Colors } from "../dmd/Colors.js"
import { Utils } from "../utils/Utils.js"
import { DMD } from "../dmd/DMD.js"
import { ResourcesManager } from "../managers/ResourcesManager.js"
import { VariablesManager } from "../managers/VariablesManager.js"
import { AudioManager } from "../managers/AudioManager.js"

/**
 * This mode runs all the time and is responsible of updating the score / player / ball texts
 */
class BaseMode extends Mode {

    constructor(_dmd: DMD, _resourcesManager: ResourcesManager, _variablesManager: VariablesManager, _audioManager: AudioManager) {
        super('base', _dmd, _resourcesManager, _variablesManager, _audioManager)
    }

    start(priority: number): boolean {
        return super.start(priority)
    }

    stop() {
        super.stop()
    }
}

export { BaseMode }