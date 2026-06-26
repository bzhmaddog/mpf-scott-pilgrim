import {IResource} from '@mpf/models';

export abstract class Resource<T> implements IResource {
    private _url: string
    readonly preload: boolean

    protected _isLoaded: boolean = false

    protected _resource: T|undefined

    protected constructor(url: string, preload: boolean) {
        this._url = url
        this.preload = preload
    }

    get resource() {
        if (this._isLoaded) {
            return this._resource
        } else {
            throw Error(`Resource "${this._url}" is not loaded`)
        }
    }

    load(): Promise<T> {
        if (this._isLoaded) {
            return new Promise<T>( resolve => resolve(this._resource as T))
        } else {
            return this._loadResource()
        }
    }

    get url() {
        return this._url
    }

    get isLoaded() {
        return this._isLoaded
    }

    protected abstract _loadResource(): Promise<T>
}
