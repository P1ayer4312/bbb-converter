const { performance } = require('node:perf_hooks');
const path = require('node:path');
const fs = require('node:fs');
const readline = require('node:readline');
const logs = require('../function/logs');
// eslint-disable-next-line no-unused-vars
const T = require('../types/typedefs');

/**
 * Wrapper class for containing random helper functions
 */
class Helper {
	/* =========================================================================== */

	/** Default video resolution */
	static defaultResolution = { width: 1920, height: 1080 };
	static scriptStartTime = 0;

	/* =========================================================================== */

	/** Store the initial time when the script started running */
	static setScriptStartTime() {
		Helper.scriptStartTime = performance.now();
	}

	/* =========================================================================== */

	/**
	 * Set window title
	 * @param {string} value
	 */
	static setTitle(value) {
		process.title = value;
	}

	/* =========================================================================== */

	/**
	 * Update the title with how many files and links are left to be processed
	 * @param {number} fileIndex
	 * @param {number} filesCount
	 * @param {number} linkIndex
	 * @param {number} linksCount
	 * @param {string} text
	 */
	static updateTitleStatus(fileIndex, filesCount, linkIndex, linksCount, text) {
		Helper.setTitle(
			`BBB Converter | ` +
				`File: ${fileIndex + 1}/${filesCount} - ` +
				`Link: ${linkIndex + 1}/${linksCount}` +
				(text ? ` | ${text}` : '')
		);
	}

	/* =========================================================================== */

	/**
	 * Prints how long the whole script was running
	 * @returns {string}
	 */
	static printScriptElapsedTime() {
		logs(
			`Total elapsed time: ` +
				Helper.formatElapsedTime(Helper.scriptStartTime, performance.now()),
			'green'
		);
	}

	/* =========================================================================== */

	/**
	 * Format elapsed time between two provided timestamps
	 * @param {number} start
	 * @param {number} end
	 * @returns {string}
	 */
	static formatElapsedTime(start, end) {
		const currentTime = (end - start) / 1000; // to seconds
		const hours = Math.floor(currentTime / 3600);
		const rawMinutes = currentTime % 3600;
		const minutes = Math.floor(rawMinutes / 60);
		const seconds = (rawMinutes % 60).toFixed(0);
		return `${hours} hours, ${minutes} minutes, ${seconds} seconds`;
	}

	/* =========================================================================== */

	/**
	 * Format seconds to readable time
	 * @param {number} value
	 * @returns {string}
	 */
	static formatTime(value) {
		const fix = (time) => {
			return time < 10 ? `0${time}` : time;
		};
		const hours = Math.floor(value / 3600);
		const rawMinutes = value % 3600;
		const minutes = Math.floor(rawMinutes / 60);
		const seconds = (rawMinutes % 60).toFixed(1);
		return `${fix(hours)}:${fix(minutes)}:${fix(seconds)}`;
	}

	/* =========================================================================== */

	static clearConsole() {
		// eslint-disable-next-line no-console
		console.clear();
	}

	/* =========================================================================== */

	/**
	 * Read all url links from the text files inside "links"
	 * @returns {T.UrlFiles}
	 */
	static async readUrlFiles() {
		/** @type {T.UrlFiles} */
		const urlFiles = {};
		const linksFolder = path.resolve('links');
		let files = [];
		/** @type {T.UrlFiles} */
		const invalidUrls = {};

		try {
			files = fs.readdirSync(linksFolder);
			files.splice(files.indexOf('example.txt'), 1);
		} catch (error) {
			logs(error.message, 'red');
			Helper.checkAndCreateFolder(linksFolder);
			Helper.createExampleLinksTemplate(linksFolder);
			process.exit(0);
		}

		if (files.length === 0) {
			logs(
				'There are no files containing links inside the "links" folder',
				'red'
			);
			process.exit(0);
		}

		// Read each file and store each valid link
		for (let file of files) {
			await new Promise((resolve) => {
				const fileName = path
					.basename(file, path.extname(file))
					.replace(/ /g, '_');

				const urls = [];
				const rl = readline.createInterface({
					input: fs.createReadStream(path.resolve(linksFolder, file)),
				});

				rl.on('line', (line) => {
					line = line.trim();
					try {
						if (line.startsWith('#') || line.length < 1) {
							// Skip comments
							return;
						}

						// This will throw an exception if the url is not valid
						new URL(line);

						urls.push(line);
					} catch {
						if (!invalidUrls[fileName]) {
							invalidUrls[fileName] = [];
						}

						invalidUrls[fileName].push(line);
					}
				});

				rl.on('close', () => {
					urlFiles[fileName] = urls;
					resolve();
				});
			});
		}

		// If there are invalid urls found, prompt the user if the script
		// should continue running or stop
		if (Object.keys(invalidUrls).length > 0) {
			logs('Invalid urls found:', 'red');
			for (let key of Object.keys(invalidUrls)) {
				// eslint-disable-next-line no-console
				console.log(`\n\t${key}:`);
				for (let url of invalidUrls[key]) {
					// eslint-disable-next-line no-console
					console.log(`\t - ${url}`);
				}
			}

			await new Promise((resolve) => {
				const rlTerminal = readline.createInterface({
					input: process.stdin,
					output: process.stdout,
				});

				rlTerminal.question('\nProceed with conversion? (y/n): ', (answer) => {
					if (!answer.toLowerCase().startsWith('y')) {
						logs(
							'Conversion stopped, fix invalid urls before proceeding',
							'red'
						);

						process.exit(0);
					}

					rlTerminal.close();
					resolve();
				});
			});
		}

		return urlFiles;
	}

	/* =========================================================================== */

	/**
	 * Check if needed folders exist and create them
	 * @param {string} folder
	 */
	static checkAndCreateFolder(folder) {
		if (!fs.existsSync(folder)) {
			logs(`Creating folder "${folder}"`, 'cyan');
			fs.mkdirSync(folder);
		}
	}

	/* =========================================================================== */

	/**
	 * Create example file inside the 'links' folder
	 * @param {string} linksFolder
	 */
	static createExampleLinksTemplate(linksFolder) {
		fs.writeFileSync(
			path.resolve(linksFolder, 'example.txt'),
			`
# - Empty lines and lines starting with hashtags are ignored
# - If the script is ran and there are invalid lines/links, the
#   script will prompt the user if it should proceed running and
#   ignore the invalid ones
# - The exported presentations will be located inside a folder
#   with the same name as the text file inside "presentations"

https://example.com/presentationId=randomLongId`
		);
	}

	/* =========================================================================== */

	/**
	 * Check if the presentation is already exported
	 * @param {T.PresentationInfo} presentation
	 */
	static isPresentationAlreadyExported(presentation) {
		const finalFileLocation = path.resolve(
			presentation.folderLocation,
			`${presentation.outputFileName}.mp4`
		);

		if (fs.existsSync(finalFileLocation)) {
			logs(`Already exported: ${presentation.getFullName()}`, 'red');
			logs(finalFileLocation, 'red');
			return true;
		}

		return false;
	}

	/* =========================================================================== */

	/**
	 * Make the script wait (only used for testing)
	 * @param {number} ms
	 * @returns {Promise<void>}
	 */
	static async wait(ms) {
		return new Promise((resolve) => {
			setTimeout(resolve, ms);
		});
	}

	/* =========================================================================== */
}

module.exports = Helper;
