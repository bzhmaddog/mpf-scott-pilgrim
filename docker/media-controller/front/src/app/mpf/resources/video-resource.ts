import {Resource} from "@mpf/resources/resource"
import { Logger, TaggedLogger } from "../../utils/logger"

let _logger: TaggedLogger | undefined
const logger = () => _logger ??= Logger.instance.getInstance('VideoResource')

export class VideoResource extends Resource<HTMLVideoElement> {
  constructor(url: string, preload: boolean) {
    super(url, preload)
  }

  protected _loadResource(): Promise<HTMLVideoElement> {

    this._resource = document.createElement('video')

    return new Promise<HTMLVideoElement>((resolve, reject) => {
      this._resource!.src = this.url

      const resource = this._resource!

      const successCallback = () => {
        this._isLoaded = true
        this._resource!.removeEventListener('loadeddata', successCallback)
        resolve(resource)
      }

      const errorCallback = (error: Event) => {
        this._resource!.removeEventListener('error', errorCallback)
        logger().error(`Resource "${this.url}" failed to load: ${error}`)
        reject(Error(`Resource "${this.url}" failed to load: ${error}`))
      }

      this._resource!.addEventListener('loadeddata', successCallback)

      this._resource!.addEventListener('error', errorCallback)

      this._resource!.load()
    })
  }
}
