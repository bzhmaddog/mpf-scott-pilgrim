import { Resource } from "./Resource.js"

class AudioResource extends Resource<AudioBuffer> {
    constructor(url: string, preload: boolean) {
        super(url, preload)
    }

    protected _loadResource(): Promise<AudioBuffer> {
        const context = new AudioContext()
        const that = this

        return new Promise<AudioBuffer>( (resolve, reject) => {
            fetch(this.url)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => context.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
                that._resource = audioBuffer
                that._isLoaded = true
                resolve(that._resource)
            })
            .catch( error => {
                 console.error(`Resource "${that.url}" failed to load: ${error.message}`)
                 reject(error)
            })
        })
    }
}

export { AudioResource }