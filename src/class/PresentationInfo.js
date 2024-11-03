const path = require('node:path');
const fs = require('node:fs');
const { performance } = require('node:perf_hooks');
const cheerio = require('cheerio');
const fetchXMLfile = require('../function/fetchXMLfile');
const logs = require('../function/logs');
// eslint-disable-next-line no-unused-vars
const T = require('../types/typedefs');
const Helper = require('./Helper');

/**
 * Wrapper class used for holding information about
 * the presentation and its files
 */
class PresentationInfo {
	/* =========================================================================== */

	/**
	 * @param {string} url
	 * @param {string} inputFileName
	 * @param {number} index
	 */
	constructor(url, inputFileName, index) {
		logs('Creating "PresentationInfo" instance', 'yellow');
		/** @type {boolean} */
		this.isLocalDevEnv = process.argv.includes('--local');

		const inputUrl = new URL(url);
		let presentationId = inputUrl.pathname.substring(
			inputUrl.pathname.lastIndexOf('/') + 1
		);

		if (presentationId == 'playback.html') {
			presentationId = inputUrl.searchParams.get('meetingId');
		}

		const folderLocation = path.resolve(
			'presentations',
			inputFileName,
			`${index}_${presentationId}`
		);
		const originalFilesUrl = `${inputUrl.protocol}//${inputUrl.hostname}/presentation/${presentationId}`;
		const filesUrl = this.isLocalDevEnv
			? 'http://localhost:3000'
			: originalFilesUrl;

		this.startTime = performance.now();
		this.courseFileName = inputFileName;
		this.url = url;
		this.filesUrl = filesUrl;
		this.originalFilesUrl = originalFilesUrl;
		this.presentationId = presentationId;
		this.folderLocation = folderLocation;
		this.dataLocation = path.resolve(folderLocation, 'data');
		this.shapesLocation = path.resolve(folderLocation, 'shapes');
		this.cursorLocation = path.resolve('src', 'static', 'cursor.png');
		this.filesUrls = {
			cursorXml: `${filesUrl}/cursor.xml`,
			slidesXml: `${filesUrl}/shapes.svg`,
			panZoomsXml: `${filesUrl}/panzooms.xml`,
			metadataXml: `${filesUrl}/metadata.xml`,
			deskshareXml: `${filesUrl}/deskshare.xml`,
		};
		this.videoFilesUrls = {
			deskshare: `${filesUrl}/deskshare/deskshare.webm`,
			webcams: `${filesUrl}/video/webcams.webm`,
		};
		this.title = null;
		this.courseName = null;
		this.duration = 0;
		/**
		 * Raw xml files in json format
		 * @type {{cursorXml, slidesXml, panZoomsXml, metadataXml, deskshareXml: T.DeskshareXML}}
		 */
		this.xmlFiles = null;
		this.outputFileName = 'presentation_export';
	}

	/* =========================================================================== */

	/**
	 * Get combined full presentation and course name
	 */
	getFullName() {
		return `${this.title} - ${this.courseName}`;
	}

	/* =========================================================================== */

	/**
	 * Used for setting up the folders used in the process of conversion
	 */
	createFolders() {
		Helper.checkAndCreateFolder(path.resolve('presentations'));
		Helper.checkAndCreateFolder(
			path.resolve('presentations', this.courseFileName)
		);
		Helper.checkAndCreateFolder(this.folderLocation);
		Helper.checkAndCreateFolder(this.dataLocation);
		Helper.checkAndCreateFolder(this.shapesLocation);
	}

	/* =========================================================================== */

	/**
	 * Clean up unnecessary files and folders when done
	 */
	deleteFolders() {
		fs.rmdirSync(this.dataLocation);
		fs.rmdirSync(this.shapesLocation);
	}

	/* =========================================================================== */

	/**
	 * Convert course name and presentation title and store them
	 */
	loadCourseInfo() {
		// Probably the least efficient way of parsing this shit
		logs('Storing course name, title and duration', 'cyan');
		const metadata = this.xmlFiles.metadataXml;
		const $ = cheerio.load(`
			<p id="bbb-context">${metadata.recording.meta['bbb-context']}</p>
			<p id="meetingName">${metadata.recording.meta['meetingName']}</p>
		`);

		this.title = $('#meetingName').text();
		this.courseName = $('#bbb-context').text();
		this.duration = Number(
			(metadata.recording.playback.duration / 1000).toFixed(2)
		);

		// Patch last slide's "out" time, for some reason it shows wrong time
		const slides = this.xmlFiles.slidesXml.svg.image;
		if (Array.isArray(slides)) {
			const lastSlide = slides[slides.length - 1];
			lastSlide.out = this.duration;
		} else {
			slides.out = this.duration;
		}
	}

	/* =========================================================================== */

	/**
	 * Fetch current xml files and store them inside the object
	 */
	async fetchAllXmlFiles(rawXMLformat = false) {
		const parsedXmlFiles = {};
		for (let name of Object.keys(this.filesUrls)) {
			const temp = await fetchXMLfile(this.filesUrls[name], rawXMLformat);
			parsedXmlFiles[name] = temp;
		}

		this.xmlFiles = parsedXmlFiles;
	}

	/* =========================================================================== */

	/**
	 * Returns elapsed time for the presentation to be converted
	 */
	getConversionDuration() {
		return Helper.formatElapsedTime(this.startTime, performance.now());
	}

	/* =========================================================================== */
}

module.exports = PresentationInfo;
