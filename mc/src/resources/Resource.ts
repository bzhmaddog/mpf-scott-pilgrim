
interface IResource {
    url: string
    isLoaded: boolean
}

abstract class Resource<T> implements IResource {
    private _url: string
    
    protected _isLoaded: boolean = false

    protected _resource: T

    constructor(url: string, preload: boolean) {
        this._url = url
        
        /*if (preload) {
            this._loadResource()
            .then(r => {
                console.log(`Resource preloaded : ${url}`)
            })
            .catch(error => {
                console.error(`Resource "${url}" preloading failed for : ${error.message}`)
            })
        }*/
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
            return new Promise<T>( resolve => resolve(this._resource))
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

export { Resource, IResource }