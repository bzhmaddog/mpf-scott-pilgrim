import { Options } from "../utils/Options.js"
import { PubSub } from "../utils/PubSub.js"

interface IVariableDictionnary {
    [index: string]: Options
}

interface IVariableChangeEvent {
    before: any,
    after: any
}

class VariablesManager {
    private _variables: IVariableDictionnary
    private _pubSub: PubSub

    constructor(namespaces: string[]) {
        this._variables = {}
        this._pubSub = new PubSub()

        namespaces.forEach(n => {
            this._variables[n] = new Options()
        })
    }


    get(p: string, k: string, d: any): any  {
        return JSON.parse(JSON.stringify(this._variables[p].get(k, d))) // return cloned object/array
    }

    set(p: string, k: string, v: any) {

        var before = undefined
        var after = JSON.parse(JSON.stringify(v))

        if (this._variables[p].get(k) !== undefined) {
            before = JSON.parse(JSON.stringify(this._variables[p].get(k))) // Use Object assign maybe ?
        }

        this._variables[p].set(k, v)

       console.log(`VariableManage.set(): [${p}][${k}]`, v)

        // Only send event if value changed
        if (JSON.stringify(before) !== JSON.stringify(after)) {
            //console.log(`Variable "${p}.${k}" changed from ${JSON.stringify(before)} to ${JSON.stringify(after)}`)

            this._pubSub.publish(`variable.${p}.${k}.changed`, {
                before : before,
                after : after
            })
        }
    }

    subscribe(message: string, callback: any) {
        this._pubSub.subscribe(message, callback)
    }

    unsubscribe(message: string, callback: any) {
        this._pubSub.unsubscribe(message, callback)
    }

    debug(p?: string) {
        if (typeof p === 'string' && typeof this._variables[p] !== 'undefined') {
            console.log(this._variables[p])
        } else {
            console.log(this._variables)
        }
    }
}

export { VariablesManager, IVariableChangeEvent }