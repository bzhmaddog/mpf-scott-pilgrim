import { Resource } from "@mpf/resources/resource"
import { Logger, TaggedLogger } from "../../utils/logger"

let _logger: TaggedLogger | undefined
const logger = () => _logger ??= Logger.instance.getInstance('AudioResource')

export class AudioResource extends Resource<AudioBuffer> {
    constructor(url: string, preload: boolean) {
        super(url, preload)
    }

    protected _loadResource(): Promise<AudioBuffer> {
        const context = new AudioContext()

        return new Promise<AudioBuffer>( (resolve, reject) => {
            fetch(this.url)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => context.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
                this._resource = audioBuffer
                this._isLoaded = true
                resolve(this._resource)
            })
            .catch( error => {
                 logger().error(`Resource "${this.url}" failed to load: ${error.message}`)
                 reject(error)
            })
        })
    }
}
