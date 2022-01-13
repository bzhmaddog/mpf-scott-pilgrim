class Utils {

	static str2int(str) {
		return parseInt(str.replace('int:',''), 10);
	};

	static str2value(str) {
		if (str.toString().startsWith('int:')) {
			return parseInt(str.replace('int:',''), 10);
		} else if (str.toString().startsWith('float:')) {
			return parseFloat(str.replace('float:',''));
		} else {
			return str.toString();
		}
	}

	static createEnum(values) {
		const enumObject = {};
		for (const val of values) {
			enumObject[val] = val;
		}
		return Object.freeze(enumObject);
	}

	/**
	 * Format score to US style but replace comma and dot with narrow space (commas and dots don't look good on DUSTY font)
	 * @param {string} s 
	 * @returns formatted string
	 */
	static formatScore(s) {
		return s.toLocaleString("en-US").replace(/[,.]/gi,'\u2009');
	}

	static format() {
		var s = arguments[0];
		var finalString = s;

		for (var i = 1 ; i < arguments.length ; i++) {
			finalString = finalString.replace("#{" + i + "}", arguments[i]);
		}
		return finalString;
	}

	/**
	 * Process an array of Promise
	 * TODO : handle errors
	 * @param {Array} promises 
	 * @returns 
	 */
	static chainPromises(promises) {
		return new Promise(resolve => {

			var queue = [...promises];

			var processQueue = function() {
				if (queue.length) {
					var promise = queue.shift();
					promise.then(() => {
						processQueue();
					});

				// finished	
				} else {
					resolve();
				}
			}

			// start process
			processQueue();
		});
	}

	static animate(duration, easing, callback) {

		if (typeof easing !== 'function') {
			throw new Error("You must provide an easing function");
		}

		if (typeof callback !== 'function') {
			throw new Error("You must provide a callback function");
		}


		return new Promise( resolve => {

			var startime = null;

			var animateFrame = function(t) {

				if (startime === null) {
					startime = t;
				}

				var delta = t - startime;

				callback(easing(delta,0,100,duration));

				if (delta >= duration) {
					resolve();
					return;
				}


				requestAnimationFrame(animateFrame)
			};

			requestAnimationFrame(animateFrame);

		});
	}
}

export { Utils };