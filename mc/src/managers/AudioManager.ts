interface IAudioBufferDictionnary {
  [index: string] : AudioBuffer
}

interface IAudioBufferSourceNodeDictionnary {
  [index: string]: AudioBufferSourceNode
}

class AudioManager {
  private _context: AudioContext;
  private _sounds: IAudioBufferDictionnary;
  private _sources: IAudioBufferSourceNodeDictionnary;

  constructor() {
    this._context = new AudioContext();
    this._sounds = {};
    this._sources = {};

    //window.audioManager = this;
  }

  addSound(key: string, sound: AudioBuffer, overwrite: boolean = false) {
    if (this._sounds[key] === undefined || overwrite) {
      this._sounds[key] = sound;
    }
  }

  playSound(key: string, pKey: string, loop: boolean = false, onEndedListener?: Function) {
	var that = this;
  var playKey = pKey;

    if (typeof playKey === 'undefined') {
      playKey = key;
    }
    
	  if (typeof this._sounds[key] === 'undefined') {
      console.log(`Sound [${key}] is not loaded`);
      return;
    }

    if (typeof this._sources[playKey] !== 'undefined') {
      console.log(`Sound [${playKey}] is already beeing played`);
      return;
    }

    var source = this._context.createBufferSource();

    source.loop = !!loop;

	// Sound finished player then delete it from sources list
	// and call external listener if provided
    source.onended = function() {
		var endedListener = onEndedListener;

		delete that._sources[playKey];

		if (typeof endedListener === 'function') {
			endedListener();
		}
	}

    this._sources[playKey] = source;

    source.buffer = this._sounds[key];
    source.connect(this._context.destination);

    console.log(`Playing sound => ${key} as ${playKey}`);
    source.start(0);
  }

  stopSound(pKey: string) {
    if (typeof this._sources[pKey] === 'undefined') {
      console.log(`Nothing to stop : [${pKey}] is not beeing played`);
      return;
    }

    this._sources[pKey].stop(0);
    delete this._sources[pKey];
  }

  reset() {
    const that = this;
    Object.keys(this._sources).forEach(s => {
      that.stopSound(s);
    });
    this._sources = {};
  }

  getContext() {
    return this._context;
  }

  getSources() {
    return this._sources;
  }
}

export { AudioManager };