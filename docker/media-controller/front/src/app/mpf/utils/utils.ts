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

	/*static format(args: unknown[]): string {
		const [s,] = args
		let finalString: string = s as string

		for (let i = 1 ; i < arguments.length ; i++) {
			finalString = finalString.replace("#{" + i + "}", args[i])
		}
		return finalString
	*/


	/*static animate(duration: number, easing: (args: unknown) => unknown, callback: () => unknown): Promise<void> {

		if (typeof easing !== 'function') {
			throw new Error("You must provide an easing function")
		}

		if (typeof callback !== 'function') {
			throw new Error("You must provide a callback function")
		}


		return new Promise( resolve => {

			let startime: number

			const animateFrame = function(t: number) {

				if (startime === null) {
					startime = t
				}

				const delta = t - startime

				callback(easing(delta,0,100,duration))

				if (delta >= duration) {
					resolve()
					return
				}


				requestAnimationFrame(animateFrame)
			}

			requestAnimationFrame(animateFrame)

		})
	}*/
}
