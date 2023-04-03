import { AudioResource } from "../resources/AudioResource.js";
import { VideoResource } from "../resources/VideoResource.js";
import { ImageResource } from "../resources/ImageResource.js";
import { FontResource } from "../resources/FontResource.js";

interface IJsonResource {
    url: string;
    preload?: boolean;
    key: string;
    group?: string;
}


interface IStringDictionary {
    [index: string]: string
}

interface IStringsDictionary {
    [index: string]: IStringDictionary
}

interface IAudioResourceDictionnary {
    [index: string]: AudioResource
}

interface IVideoResourceDictionnary {
    [index: string]: VideoResource
}

interface IImageResourceDictionnary {
    [index: string]: ImageResource
}

interface IFontResourceDictionnary {
    [index: string]: FontResource
}


// Used only during load time
interface IResources {
    strings: IStringsDictionary,
    musics: IJsonResource[],
    sounds: IJsonResource[],
    videos: IJsonResource[],
    images: IJsonResource[],
    fonts: IJsonResource[],
    imagesCollections: IJsonResource[],
}




class ResourcesManager {
    //private _res: IResources;
    private _resourcesLoaded: boolean = false;
    private _resFile: string;
    private _basePath: string;
    private _locale: string;
    private _strings: IStringsDictionary = {};
    private _musics: IAudioResourceDictionnary = {};
    private _sounds: IAudioResourceDictionnary = {};
    private _videos: IVideoResourceDictionnary = {};
    private _images: IImageResourceDictionnary = {};
    private _fonts: IFontResourceDictionnary = {};
    private _groups: string[] = [];

    constructor(_file: string, _basePath: string, locale: string = "en-US") {
        this._basePath = _basePath.endsWith("/") ? _basePath : _basePath + "/";
        this._resFile = this._basePath + _file;
        this._locale = locale;
    }

    load(): Promise<ResourcesManager> {
        var that = this; // Keep ref of this for use inside onReadyStateChange

        return new Promise((resolve, reject) => {

            fetch(that._resFile)
            .then(response => response.json())
            .then(data => {

                // set strings
                that._strings = data.strings;

                var preloadList: Promise<any>[] = [];

                // set musics
                data.musics.map((r:IJsonResource) => {
                    const resource = new AudioResource(that._basePath + 'audio/musics/' + r.url, r.preload);
                    that._musics[r.key] = resource;
                    that._addGroup(r.group);
                    if (!!r.preload) {
                        preloadList.push(resource.load());
                    }
                });

                // set sounds
                data.sounds.map((r:IJsonResource) => {
                    
                    const resource = new AudioResource(that._basePath + 'audio/sounds/' + r.url, r.preload);
                    that._sounds[r.key] = resource;
                    that._addGroup(r.group);
                    if (!!r.preload) {
                        preloadList.push(resource.load());
                    }
                });

                // set videos
                data.videos.map((r:IJsonResource) => {
                    const resource = new VideoResource(that._basePath + 'videos/' + r.url, r.preload);
                    that._videos[r.key] = resource;
                    that._addGroup(r.group);
                    if (!!r.preload) {
                        preloadList.push(resource.load());
                    }
                });

                // set images
                data.images.map((r:IJsonResource) => {
                    const resource =  new ImageResource(that._basePath + 'images/' + r.url, r.preload);
                    that._images[r.key] = resource;
                    that._addGroup(r.group);
                    if (!!r.preload) {
                        preloadList.push(resource.load());
                    }
                });

                // set fonts
                data.fonts.map((r:IJsonResource) => {
                    const resource = new FontResource(r.key, that._basePath + 'fonts/' + r.url, r.preload);
                    that._fonts[r.key] = resource;
                    that._addGroup(r.group);
                    if (!!r.preload) {
                        preloadList.push(resource.load());
                    }
                });

                Promise
                .all(preloadList)
                .then( (resources) => {
                    that._resourcesLoaded = true;
                    resolve(that);
                })
                .catch(error => {
                    console.error(error);
                    reject();
                });
            })
            .catch(error => {
                console.error(error);
                reject();
            });
        });
    }

    getBasePath(): string {
        return this._basePath;
    }

    getString(key: string): string {
        this._areResourcesLoaded();
        return this._strings[this._locale][key] || `String ${key} not found`;
    }

    getMusic(key: string): AudioResource {
        this._areResourcesLoaded();
        return this._musics[key];
    }

    getSound(key: string): AudioResource {
        this._areResourcesLoaded();
        return this._sounds[key];
    }

    getImage(key: string): ImageResource {
        this._areResourcesLoaded();
        return this._images[key];
    }

    getVideo(key: string): VideoResource {
        this._areResourcesLoaded();
        return this._videos[key];
    }

    getFont(key: string): FontResource {
        this._areResourcesLoaded();
        return this._fonts[key];
    }

    private _areResourcesLoaded(): Promise<void> {
        return new Promise( resolve => {
            if (!this._resourcesLoaded) {
                throw Error("Resources are not loaded");
            }
            resolve();
        });
    }

    private _addGroup(group?:string) {
        if (typeof group === 'string' && !this._groups.includes(group)) {
            this._groups.push(group);
        }
    }

}

export { ResourcesManager };
