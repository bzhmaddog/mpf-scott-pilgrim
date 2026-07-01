import {Colors} from 'h5dmd'

export const AppColors = {
	...Colors,
	DarkGreen : "#006400"
} as const

export class Utils {

	static str2int(str: string): number {
		return parseInt(str.replace('int:',''), 10)
	}

	static str2value(str: string) {
		if (str.toString().startsWith('int:')) {
			return parseInt(str.replace('int:',''), 10)
		} else if (str.toString().startsWith('float:')) {
			return parseFloat(str.replace('float:',''))
		} else {
			return str.toString()
		}
	}

	/**
	 * Format score to US style but replace comma and dot with narrow space (commas and dots don't look good on DUSTY font)
	 * @param {string} s
	 * @returns formatted string
	 */
	static formatScore(s: number): string {
		return s.toLocaleString().replace(/[,.]/gi,'\u2009') // "en-US" toLocaleString does not want a param
	}
}
