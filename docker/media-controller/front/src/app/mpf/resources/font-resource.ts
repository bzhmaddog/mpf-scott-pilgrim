import { Resource } from "@mpf/resources/resource"

export class FontResource extends Resource<FontFace> {

    private _name: string

    constructor(name: string, url: string, preload: boolean) {
        super(url, preload)
        this._name = name
    }

    protected _loadResource(): Promise<FontFace> {
        return new Promise<FontFace>( (resolve, reject) => {

            new FontFace(this._name, 'url(' + this.url + ')')
            .load()
            .then(fontFace => {
                this._resource = fontFace
                this._isLoaded = true
                resolve(this._resource)
            })
            .catch( error => {
                console.error(`Resource "${this.url}" failed to load: ${error.message}`)
                reject(error)
             })
        })
    }
}
