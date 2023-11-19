const path = require('node:path');
const fs = require('node:fs');
const cheerio = require('cheerio');
const fetchXMLfile = require('../function/fetchXMLfile');
const logs = require('../function/logs');
// eslint-disable-next-line no-unused-vars
const T = require('../types/typedefs');

/**
 * Wrapper class used for holding information about
 * the presentation and its files
 */
class PresentationInfo {
	/** @param {string} url */
	constructor(url) {
		logs('Creating "PresentationInfo" instance', 'yellow');
		/** @type {boolean} */
		this.isLocalDevEnv = process.argv.includes('--local');

		const inputUrl = new URL(url);
		const presentationId = inputUrl.pathname.substring(
			inputUrl.pathname.lastIndexOf('/') + 1
		);
		const folderLocation = path.resolve('presentations', `p_${presentationId}`);
		const originalFilesUrl = `${inputUrl.protocol}//${inputUrl.hostname}/presentation/${presentationId}`;
		const filesUrl = this.isLocalDevEnv
			? 'http://localhost:3000'
			: originalFilesUrl;

		this.startTime = new Date();
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
	getFullName() {
		return `${this.title} - ${this.courseName}`;
	}
	/**
	 * Used for setting up the folders used in the process of conversion
	 */
	createFolders() {
		// Check if needed folders exist and create them
		const checkAndCreate = (folder) => {
			if (!fs.existsSync(folder)) {
				logs(`Creating folder "${folder}"`, 'cyan');
				fs.mkdirSync(folder);
			}
		};

		checkAndCreate(path.resolve('presentations'));
		checkAndCreate(this.folderLocation);
		checkAndCreate(this.dataLocation);
		checkAndCreate(this.shapesLocation);
	}
	/**
	 * Clean up unnecessary files and folders when done
	 */
	deleteFolders() {
		fs.rmdirSync(this.dataLocation);
		fs.rmdirSync(this.shapesLocation);
	}
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
	/**
	 * Returns elapsed time for the presentation to be converted
	 */
	getConversionDuration() {
		const currentTime = new Date();
		const hours = Math.abs(currentTime.getHours() - this.startTime.getHours());
		const minutes = Math.abs(
			currentTime.getMinutes() - this.startTime.getMinutes()
		);
		const seconds = Math.abs(
			currentTime.getSeconds() - this.startTime.getSeconds()
		);
		return `${hours} hours, ${minutes} minutes, ${seconds} seconds`;
	}
}

module.exports = PresentationInfo;
