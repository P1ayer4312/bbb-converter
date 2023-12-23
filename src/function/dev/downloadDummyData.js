const fs = require('node:fs');
const path = require('node:path');
const PresentationInfo = require('../../class/PresentationInfo');

/**
 * Function used for downloading presentation data to use
 * for simulating data during development
 */
async function downloadDummyData() {
	const presentationUrl = 'BBB_URL_HERE';

	const dummyDataLocation = path.resolve('src', 'devDummyData');
	if (!fs.existsSync(dummyDataLocation)) {
		fs.mkdirSync(dummyDataLocation);
	}
	const BBB = new PresentationInfo(presentationUrl, 'testing');
	await BBB.fetchAllXmlFiles(true);
	for (let xmlFile in BBB.xmlFiles) {
		let fileName = xmlFile.replace('Xml', '.xml').toLowerCase();
		if (xmlFile === 'slidesXml') {
			fileName = 'shapes.svg';
		}
		fs.writeFileSync(
			path.resolve(dummyDataLocation, fileName),
			BBB.xmlFiles[xmlFile]
		);
	}
}

downloadDummyData();
