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
}

export { Utils };