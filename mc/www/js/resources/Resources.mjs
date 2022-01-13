
class Resources {
    #res;
    #resourcesLoaded;
    #resFile;
    #basePath;

    constructor(_file, _basePath) {
        this.#res = {};
        this.#resourcesLoaded = false;
        this.#resFile = _file;
        this.#basePath = _basePath.endsWith("/") ? _basePath : _basePath + "/";
    }

    load() {
        var that = this; // Keep ref of this for use inside onReadyStateChange

        return new Promise((resolve, reject) => {

            var xhr = new XMLHttpRequest();
        
            xhr.overrideMimeType("application/json");
            xhr.open('GET', `${this.#resFile}`, true);
            xhr.onreadystatechange = function() {
                if (xhr.readyState == 4 && xhr.status == "200") {
                    var res = Object.assign(that.#res, JSON.parse(xhr.responseText));

                    Object.keys(res).forEach(k => {
                        if (Array.isArray(res[k])) {
                            for (var i = 0 ; i < res[k].length ; i++) {
                                if (typeof res[k][i] === 'object' && res[k][i].hasOwnProperty('url')) {
                                    res[k][i].url = that.#basePath + res[k][i].url;
                                } else {
                                    throw new Error(`Entry without url : ${res[k][i].key}`);
                                }
                            }
                        } else {
                            if (res[k].hasOwnProperty('url')) {
                                res[k].url = that.#basePath + res[k].url;
                            }
                        }
                    });

                    that.#res = res;
                    that.#resourcesLoaded = true;

                    //console.log(res);

                    resolve(that);
                }  
            }
            xhr.onerror = reject;
            xhr.send(null);  
        });
    }

    #getResource(key, prefix) {
        if (typeof this.#res[prefix] === 'undefined') {
            return null;
        }

        var r = this.#res[prefix].filter(m => { return m.key === key });

        return (r.length) ? r[0].url: null;
    }

    getBasePath() {
        return this._basePath;
    }

    getMusic(key) {
        return this.#getResource(key, 'musics');
    }

    getSound(key) {
        return this.#getResource(key, 'sounds');
    }

    getImage(key) {
        return this.#getResource(key, 'images');
    }

    getAnimation(key) {
        return this.#getResource(key, 'animations');
    }

    getSprite(key) {
        return this.#getResource(key, 'sprites');
    }

    getVideo(key) {
        return this.#getResource(key, 'videos');
    }

    getString(key) {
        return (this.#resourcesLoaded && typeof this.#res.strings[key] === 'string') ? this.#res.strings[key] : "String not found or resources not loaded";
    }

    getFont(key) {
        if (!this.#resourcesLoaded) {
            console.log("Resources not loaded");
            return null;
        }

        var r = res.fonts.filter(f => { return f.key === key });

        if (r.length) {        
            return r[0];
        } else {
            return null;
        }
    }

    getMusics() {
        return this.#res.musics;
    }

    getSounds() {
        return this.#res.sounds;
    }

    getFonts() {
        return this.#res.fonts;
    }

    getStrings() {
        return this.#res.strings;
    }
}

export { Resources };
