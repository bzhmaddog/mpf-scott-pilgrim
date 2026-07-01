import { Resource } from "@mpf/resources/resource"
import { Logger, TaggedLogger } from "../../utils/logger"

let _logger: TaggedLogger | undefined
const logger = () => _logger ??= Logger.instance.getInstance('ImageResource')

export class ImageResource extends Resource<ImageBitmap> {
    constructor(url: string, preload: boolean) {
        super(url, preload)
    }

    protected _loadResource(): Promise<ImageBitmap> {
        return new Promise<ImageBitmap>( (resolve, reject) => {

            fetch(this.url)
            .then(response => response.blob())
            .then(blob => createImageBitmap(blob))
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
