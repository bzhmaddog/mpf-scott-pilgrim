import { Resource } from "./Resource.js"

class VideoResource extends Resource<HTMLVideoElement> {
    constructor(url: string, preload: boolean) {
        super(url, preload)
    }

    protected _loadResource(): Promise<HTMLVideoElement> {
        const that = this

        this._resource = document.createElement('video')

        return new Promise<HTMLVideoElement>( (resolve, reject) => {
            
            const successCallback = function() {
                that._isLoaded = true
                that._resource.removeEventListener('loadeddata', this)
                resolve(that._resource)
            }

            const errorCallback = function(error: Event) {
                that._resource.removeEventListener('error', this)
                reject(Error(`Resource "${that.url}" failed to load: ${error}`))
            }

            that._resource.src = that.url
            
            that._resource.addEventListener('loadeddata', successCallback)

            this._resource.addEventListener('error', errorCallback)

            that._resource.load()
        })
    }
}

export { VideoResource }