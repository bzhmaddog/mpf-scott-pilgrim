import {inject, Service} from "@angular/core";
import {Logger} from "../../utils/logger";

interface IAudioBufferDictionary {
  [index: string] : AudioBuffer
}

interface IAudioBufferSourceNodeDictionary {
  [index: string]: AudioBufferSourceNode
}

@Service()
export class AudioManager {
  private readonly _context: AudioContext
  private readonly _sounds: IAudioBufferDictionary
  private _sources: IAudioBufferSourceNodeDictionary

  constructor() {
    this._context = new AudioContext()
    this._sounds = {}
    this._sources = {}
  }

  private readonly _logger = inject(Logger).getInstance('AudioManager');

  addSound(key: string, sound: AudioBuffer, overwrite: boolean = false) {
    if (this._sounds[key] === undefined || overwrite) {
      this._sounds[key] = sound
    }
  }

  playSound(key: string, pKey: string, loop: boolean = false, onEndedListener?: () => void) {

    let playKey = pKey

    if (typeof playKey === 'undefined') {
      playKey = key
    }

    if (typeof this._sounds[key] === 'undefined') {
      this._logger.log(`Sound [${key}] is not loaded`)
      return
    }

    if (typeof this._sources[playKey] !== 'undefined') {
      this._logger.log(`Sound [${playKey}] is already beeing played`)
      return
    }

    const source = this._context.createBufferSource()

    source.loop = loop

	// Sound finished player then delete it from sources list
	// and call external listener if provided
    source.onended = () => {
		const endedListener = onEndedListener

		delete this._sources[playKey]

		if (typeof endedListener === 'function') {
			endedListener()
		}
	}

    this._sources[playKey] = source

    source.buffer = this._sounds[key]
    source.connect(this._context.destination)

    this._logger.log(`Playing sound => ${key} as ${playKey}`)
    source.start(0)
  }

  stopSound(pKey: string) {
    if (typeof this._sources[pKey] === 'undefined') {
      this._logger.log(`Nothing to stop : [${pKey}] is not beeing played`)
      return
    }

    this._sources[pKey].stop(0)
    delete this._sources[pKey]
  }

  reset() {
    Object.keys(this._sources).forEach(s => {
      this.stopSound(s)
    })
    this._sources = {}
  }

  getContext() {
    return this._context
  }

  getSources() {
    return this._sources
  }
}
