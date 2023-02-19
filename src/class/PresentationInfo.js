const path = require('node:path');
const fs = require('node:fs');
const cheerio = require('cheerio');
const fetchXMLfile = require('../function/fetchXMLfile');

class PresentationInfo {
	/**
	 * Wrapper class used for holding informations about
	 * the presentation and its files
	 * @param {String} url
	 * @param {String} dummyDataUrl used for testing
	 */
	constructor(url, dummyDataUrl) {
		const inputUrl = new URL(url);
		const presentationId = inputUrl.pathname.substring(
			inputUrl.pathname.lastIndexOf('/') + 1
		);
		const folderLocation = path.resolve('presentations', `p_${presentationId}`);
		const filesUrl = dummyDataUrl
			? dummyDataUrl
			: `${inputUrl.protocol}//${inputUrl.hostname}/presentation/${presentationId}`;

		this.url = url;
		this.presentationId = presentationId;
		this.folderLocation = folderLocation;
		this.dataLocation = path.resolve(folderLocation, 'data');
		this.shapesLocation = path.resolve(folderLocation, 'shapes');
		this.filesUrls = {
			cursorXml: `${filesUrl}/cursor.xml`,
			slidesXml: `${filesUrl}/shapes.svg`,
			panZoomXml: `${filesUrl}/panzooms.xml`,
			deskshareXml: `${filesUrl}/deskshare.xml`,
			metadataXml: `${filesUrl}/metadata.xml`,
		};
		this.title = null;
		this.courseName = null;
		this.xmlFiles = null;
	}

	/**
	 * Used for setting up the folders used in the process of conversion
	 */
	createFolders() {
		// Check if presentations folder exists
		if (!fs.existsSync(path.resolve('presentations'))) {
			fs.mkdirSync('presentations');
		}
		// Check if folder exists and create needed folders
		if (!fs.existsSync(this.folderLocation)) {
			fs.mkdirSync(this.folderLocation);
			fs.mkdirSync(this.dataLocation);
			fs.mkdirSync(this.shapesLocation);
		}
	}
	/**
	 * Convert course name and presentation title and store them
	 */
	async loadCourseNameAndTitle() {
		// Probably the least efficient way of parsing this shit
		const metadata = this.xmlFiles.metadataXml;
		const $ = cheerio.load(`
			<p id="bbb-context">${metadata.recording.meta['bbb-context']}</p>
			<p id="meetingName">${metadata.recording.meta['meetingName']}</p>
		`);

		this.title = $('#meetingName').text();
		this.courseName = $('#bbb-context').text();
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
