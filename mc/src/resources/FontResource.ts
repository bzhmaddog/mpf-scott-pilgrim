import { Resource } from "./Resource.js"

class FontResource extends Resource<FontFace> {

    private _name: string

    constructor(name: string, url: string, preload: boolean) {
        super(url, preload)
        this._name = name
    }

    protected _loadResource(): Promise<FontFace> {
        const that = this

        return new Promise<FontFace>( (resolve, reject) => {

            new FontFace(that._name, 'url(' + that.url + ')')
            .load()
            .then(fontFace => {
                that._resource = fontFace
                that._isLoaded = true
                resolve(that._resource)
            })
            .catch( error => { 
                console.error(`Resource "${that.url}" failed to load: ${error.message}`)
                reject(error)
             })
    

        })

    }
}

export { FontResource }