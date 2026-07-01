import {inject, Service} from "@angular/core";
import {Logger} from "../../utils/logger";


import { AudioResource } from "@mpf/resources/audio-resource"
import { VideoResource } from "@mpf/resources/video-resource"
import { ImageResource } from "@mpf/resources/image-resource"
import { FontResource } from "@mpf/resources/font-resource"
import {IJsonResource, IResource, IResourcesManagerConfig, ResourceEntry, ResourcesSnapshot} from '@mpf/models';
import {resourcesManager} from "@mpf/services";


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


@Service()
export class ResourcesManager {
    private _resourcesLoaded: boolean = false
    private readonly _basePath: string
    private readonly _locale: string
    private _strings: IStringsDictionary = {}
    private _musics: IAudioResourceDictionary = {}
    private _sounds: IAudioResourceDictionary = {}
    private _videos: IVideoResourceDictionary = {}
    private _images: IImageResourceDictionary = {}
    private _fonts: IFontResourceDictionary = {}
    private _groups: string[] = []

    private readonly _config = inject<IResourcesManagerConfig>(resourcesManager);
    private readonly _logger = inject(Logger).getInstance('ResourcesManager');

    constructor() {
        this._basePath = this._config.basePath.endsWith("/") ? this._config.basePath : this._config.basePath + "/"
        this._locale = this._config.locale ?? 'en-US'
    }

    load(): Promise<ResourcesManager> {
        const data = this._config.data
        const preloadList: Promise<unknown>[] = []

        this._strings = data.strings

        // set musics
        data.musics.forEach((r: IJsonResource) => {
            const resource = new AudioResource(this._basePath + 'audio/musics/' + r.url, r.preload ?? false)
            this._musics[r.key] = resource
            this._addGroup(r.group)
            if (r.preload) {
                preloadList.push(resource.load())
            }
        })

        // set sounds
        data.sounds.forEach((r: IJsonResource) => {
            const resource = new AudioResource(this._basePath + 'audio/sounds/' + r.url, r.preload ?? false)
            this._sounds[r.key] = resource
            this._addGroup(r.group)
            if (r.preload) {
                this._logger.log(`Preloading sound : ${r.key}`)
                preloadList.push(resource.load())
            }
        })

        // set videos
        data.videos.forEach((r: IJsonResource) => {
            const resource = new VideoResource(this._basePath + 'videos/' + r.url, r.preload ?? false)
            this._videos[r.key] = resource
            this._addGroup(r.group)
            if (r.preload) {
                preloadList.push(resource.load())
            }
        })

        // set images
        data.images.forEach((r: IJsonResource) => {
            const resource = new ImageResource(this._basePath + 'images/' + r.url, r.preload ?? false)
            this._images[r.key] = resource
            this._addGroup(r.group)
            if (r.preload) {
                preloadList.push(resource.load())
            }
        })

        // set fonts
        data.fonts.forEach((r: IJsonResource) => {
            const resource = new FontResource(r.key, this._basePath + 'fonts/' + r.url, r.preload ?? false)
            this._fonts[r.key] = resource
            this._addGroup(r.group)
            if (r.preload) {
                preloadList.push(resource.load())
            }
        })

        return Promise
            .all(preloadList)
            .then(() => {
                this._resourcesLoaded = true
                return this
            })
            .catch(error => {
                this._logger.error(error)
                throw error
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

    getSnapshot(): ResourcesSnapshot {
        return {
            loaded: this._resourcesLoaded,
            musics: this._toEntries(this._musics),
            sounds: this._toEntries(this._sounds),
            videos: this._toEntries(this._videos),
            images: this._toEntries(this._images),
            fonts: this._toEntries(this._fonts),
        }
    }

    private _toEntries(dict: { [key: string]: IResource }): ResourceEntry[] {
        return Object.entries(dict).map(([key, r]) => ({
            key,
            url: r.url,
            preload: r.preload,
            isLoaded: r.isLoaded,
        }))
    }

}
