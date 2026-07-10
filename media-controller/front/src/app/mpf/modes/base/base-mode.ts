import {Mode} from "@mpf/core/mode"

class BaseMode extends Mode {

    constructor() {
        super('base')
    }

    override start(priority: number): boolean {
        return super.start(priority)
    }

    override stop() {
        super.stop()
    }
}

export { BaseMode }
