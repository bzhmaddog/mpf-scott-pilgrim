import { Mode } from "./Mode.mjs";
import { Colors } from "../dmd/Colors.mjs"
import { Utils } from "../utils/Utils.mjs"

/**
 * This mode runs all the time and is responsible of updating the score / player / ball texts
 */
class BaseMode extends Mode {

    constructor(_dmd, _resources, _fonts, _variables, _audioManager) {
        super(_dmd, _resources, _fonts, _variables, _audioManager);

        this.name = 'base';
    }

    start(priority) {
        // Ugly but not sure howto do better
        if (!super.start(priority)) {
            return;
        }
    }

    stop() {
        super.stop();
    }
}

export { BaseMode };