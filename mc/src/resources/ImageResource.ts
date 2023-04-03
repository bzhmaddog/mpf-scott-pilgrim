import { Resource } from "./Resource.js";

class ImageResource extends Resource<ImageBitmap> {
    constructor(url: string, preload: boolean) {
        super(url, preload);
    }

    protected _loadResource(): Promise<ImageBitmap> {
        const that = this;

        return new Promise<ImageBitmap>( (resolve, reject) => {
            
            fetch(that.url)
            .then(response => response.blob())
            .then(blob => createImageBitmap(blob))
            .then(audioBuffer => {
                that._resource = audioBuffer;
                that._isLoaded = true;
                resolve(that._resource);
            })
            .catch( error => {
                console.error(`Resource "${that.url}" failed to load: ${error.message}`);
                reject(error);
             });
        });
    }
}

export { ImageResource }