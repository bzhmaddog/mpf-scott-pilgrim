import {Inject, Injectable} from "@angular/core";


import { AudioResource } from "@mpf/resources/audio-resource"
import { VideoResource } from "@mpf/resources/video-resource"
import { ImageResource } from "@mpf/resources/image-resource"
import { FontResource } from "@mpf/resources/font-resource"
import {resourcesManager} from "@mpf/services";

interface IJsonResource {
    url: string
    preload?: boolean
    key: string
    group?: string
}


interface IStringDictionary {
    [index: string]: string
}

interface IStringsDictionary {
    [index: string]: IStringDictionary
}

interface IAudioResourceDictionary {
    [index: string]: AudioResource
}

interface IVideoResourceDictionary {
    [index: string]: VideoResource
}

interface IImageResourceDictionary {
    [index: string]: ImageResource
}

interface IFontResourceDictionary {
    [index: string]: FontResource
}

export interface IResourcesManagerConfig {
  file: string;
  basePath: string;
  locale?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ResourcesManager {
    private _resourcesLoaded: boolean = false
    private readonly _resFile: string
    private readonly _basePath: string
    private readonly _locale: string
    private _strings: IStringsDictionary = {}
    private _musics: IAudioResourceDictionary = {}
    private _sounds: IAudioResourceDictionary = {}
    private _videos: IVideoResourceDictionary = {}
    private _images: IImageResourceDictionary = {}
    private _fonts: IFontResourceDictionary = {}
    private _groups: string[] = []

    constructor(@Inject(resourcesManager) config: IResourcesManagerConfig) {
        this._basePath = config.basePath.endsWith("/") ? config.basePath : config.basePath + "/"
        this._resFile = this._basePath + config.file
        this._locale = config.locale ?? 'en-US'
    }

    load(): Promise<ResourcesManager> {

        return new Promise((resolve, reject) => {

            fetch(this._resFile)
            .then(response => response.json())
            .then(data => {

                // set strings
                this._strings = data.strings

                const preloadList: Promise<unknown>[] = []

                // set musics
                data.musics.map((r:IJsonResource) => {
                    const resource = new AudioResource(this._basePath + 'audio/musics/' + r.url, r.preload ?? false)
                    this._musics[r.key] = resource
                    this._addGroup(r.group)
                    if (r.preload) {
                        preloadList.push(resource.load())
                    }
                })

                // set sounds
                data.sounds.map((r:IJsonResource) => {

                    const resource = new AudioResource(this._basePath + 'audio/sounds/' + r.url, r.preload ?? false)
                    this._sounds[r.key] = resource
                    this._addGroup(r.group)
                    if (r.preload) {
                        console.log(`Preloading sound : ${r.key}`)
                        preloadList.push(resource.load())
                    }
                })

                // set videos
                data.videos.map((r:IJsonResource) => {
                    const resource = new VideoResource(this._basePath + 'videos/' + r.url, r.preload ?? false)
                    this._videos[r.key] = resource
                    this._addGroup(r.group)
                    if (r.preload) {
                        preloadList.push(resource.load())
                    }
                })

                // set images
                data.images.map((r:IJsonResource) => {
                    const resource =  new ImageResource(this._basePath + 'images/' + r.url, r.preload ?? false)
                    this._images[r.key] = resource
                    this._addGroup(r.group)
                    if (r.preload) {
                        preloadList.push(resource.load())
                    }
                })

                // set fonts
                data.fonts.map((r:IJsonResource) => {
                    const resource = new FontResource(r.key, this._basePath + 'fonts/' + r.url, r.preload ?? false)
                    this._fonts[r.key] = resource
                    this._addGroup(r.group)
                    if (r.preload) {
                        preloadList.push(resource.load())
                    }
                })

                Promise
                .all(preloadList)
                .then( () => {
                    this._resourcesLoaded = true
                    resolve(this)
                })
                .catch(error => {
                    console.error(error)
                    reject()
                })
            })
            .catch(error => {
                console.error(error)
                reject()
            })
        })
    }

    getBasePath(): string {
        return this._basePath
    }

    getString(key: string): string {
        this._areResourcesLoaded()
        return this._strings[this._locale][key] || `String ${key} not found`
    }

    getMusic(key: string): AudioResource {
        this._areResourcesLoaded()
        return this._musics[key]
    }

    getSound(key: string): AudioResource {
        this._areResourcesLoaded()
        return this._sounds[key]
    }

    getImage(key: string): ImageResource {
        this._areResourcesLoaded()
        return this._images[key]
    }

    getVideo(key: string): VideoResource {
        this._areResourcesLoaded()
        return this._videos[key]
    }

    getFont(key: string): FontResource {
        this._areResourcesLoaded()
        return this._fonts[key]
    }

    private _areResourcesLoaded(): boolean {
        if (!this._resourcesLoaded) {
            throw Error("Resources are not loaded")
        }

        return true
    }

    private _addGroup(group?:string) {
        if (typeof group === 'string' && !this._groups.includes(group)) {
            this._groups.push(group)
        }
    }

}
