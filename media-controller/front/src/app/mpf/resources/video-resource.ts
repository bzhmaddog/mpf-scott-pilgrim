import {Resource} from "@mpf/resources/resource"
import { Logger, TaggedLogger } from "../../utils/logger"

let _logger: TaggedLogger | undefined
const logger = () => _logger ??= Logger.instance.getInstance('VideoResource')

export class VideoResource extends Resource<HTMLVideoElement> {
  constructor(url: string, preload: boolean) {
    super(url, preload)
  }

  protected _loadResource(): Promise<HTMLVideoElement> {
    const videoElement = document.createElement('video')
    this._resource = videoElement

    return new Promise<HTMLVideoElement>((resolve, reject) => {
      videoElement.src = this.url

      const successCallback = () => {
        this._isLoaded = true
        videoElement.removeEventListener('loadeddata', successCallback)
        videoElement.removeEventListener('error', errorCallback)
        resolve(videoElement)
      }

      const errorCallback = (error: Event) => {
        videoElement.removeEventListener('loadeddata', successCallback)
        videoElement.removeEventListener('error', errorCallback)
        logger().error(`Resource "${this.url}" failed to load: ${error}`)
        reject(Error(`Resource "${this.url}" failed to load: ${error}`))
      }

      videoElement.addEventListener('loadeddata', successCallback)
      videoElement.addEventListener('error', errorCallback)
      videoElement.load()
    })
  }
}
