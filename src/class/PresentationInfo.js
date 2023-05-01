const path = require('node:path');
const fs = require('node:fs');
const cheerio = require('cheerio');
const fetchXMLfile = require('../function/fetchXMLfile');
const logs = require('../function/logs');
// eslint-disable-next-line no-unused-vars
const typedefs = require('../types/typedefs');

/**
 * Wrapper class used for holding informations about
 * the presentation and its files
 */
class PresentationInfo {
	/**
	 * @param {String} url
	 * @param {String} dummyDataUrl used for testing
	 */
	constructor(url, dummyDataUrl) {
		logs('Creating "PresentationInfo" instance');
		const inputUrl = new URL(url);
		const presentationId = inputUrl.pathname.substring(
			inputUrl.pathname.lastIndexOf('/') + 1
		);
		const folderLocation = path.resolve('presentations', `p_${presentationId}`);
		const filesUrl = dummyDataUrl
			? dummyDataUrl
			: `${inputUrl.protocol}//${inputUrl.hostname}/presentation/${presentationId}`;

		this.url = url;
		this.filesUrl = filesUrl;
		this.presentationId = presentationId;
		this.folderLocation = folderLocation;
		this.dataLocation = path.resolve(folderLocation, 'data');
		this.shapesLocation = path.resolve(folderLocation, 'shapes');
		this.cursorLocation = path.resolve('src', 'static', 'cursor.png');
		this.filesUrls = {
			cursorXml: `${filesUrl}/cursor.xml`,
			slidesXml: `${filesUrl}/shapes.svg`,
			panZoomXml: `${filesUrl}/panzooms.xml`,
			metadataXml: `${filesUrl}/metadata.xml`,
			deskshareXml: `${filesUrl}/deskshare.xml`,
		};
		this.videoFilesUrls = {
			deskshare: `${filesUrl}/deskshare/deskshare.webm`,
			webcams: `${filesUrl}/video/webcams.webm`,
		};
		this.title = null;
		this.courseName = null;
		/**
		 * Raw xml files in json format
		 * @type {{cursorXml, slidesXml, panZoomXml, metadataXml, deskshareXml: typedefs.DeskshareXML}}
		 */
		this.xmlFiles = null;
	}
	/**
	 * Used for setting up the folders used in the process of conversion
	 */
	createFolders() {
		// Check if needed folders exist and create them
		const checkAndCreate = (folder) => {
			if (!fs.existsSync(folder)) {
				logs(`Creating folder "${folder}"`);
				fs.mkdirSync(folder);
			}
		}

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
	loadCourseNameAndTitle() {
		// Probably the least efficient way of parsing this shit
		logs('Storing course name and title');
		const metadata = this.xmlFiles.metadataXml;
		const $ = cheerio.load(`
			<p id="bbb-context">${metadata.recording.meta['bbb-context']}</p>
			<p id="meetingName">${metadata.recording.meta['meetingName']}</p>
		`);

		this.title = $('#meetingName').text();
		this.courseName = $('#bbb-context').text();
		logs(this.title);
		logs(this.courseName);
	}
	/**
	 * Fetch current xml files and store them inside the object
	 */
	async fetchAllXmlFiles() {
		const parsedXmlFiles = {};
		for (let name of Object.keys(this.filesUrls)) {
			const temp = await fetchXMLfile(this.filesUrls[name]);
			parsedXmlFiles[name] = temp;
		}

		this.xmlFiles = parsedXmlFiles;
	}
}

module.exports = PresentationInfo;
