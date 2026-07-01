export interface IResource {
    url: string
    preload: boolean
    isLoaded: boolean
}

export interface IJsonResource {
    url: string
    preload?: boolean
    key: string
    group?: string
}

export interface IResourcesData {
    strings: { [locale: string]: { [key: string]: string } }
    musics: IJsonResource[]
    sounds: IJsonResource[]
    videos: IJsonResource[]
    images: IJsonResource[]
    fonts: IJsonResource[]
}

export interface IResourcesManagerConfig {
    data: IResourcesData
    basePath: string
    locale?: string
}

export interface ResourceEntry {
    key: string
    url: string
    preload: boolean
    isLoaded: boolean
}

export interface ResourcesSnapshot {
    loaded: boolean
    musics: ResourceEntry[]
    sounds: ResourceEntry[]
    videos: ResourceEntry[]
    images: ResourceEntry[]
    fonts: ResourceEntry[]
}
