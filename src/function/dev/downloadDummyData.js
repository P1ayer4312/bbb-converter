const fs = require('node:fs');
const path = require('node:path');
const PresentationInfo = require('../../class/PresentationInfo');

/**
 * Function used for downloading presentation data to use
 * for simulating data during development
 */
async function downloadDummyData() {
	const presentationUrl =
		'https://bbb-lb.finki.ukim.mk/playback/presentation/2.3/5e08975ff07fc081d979f50c104694f0ad3a688a-1602142107072?meetingId=5e08975ff07fc081d979f50c104694f0ad3a688a-1602142107072';

	const dummyDataLocation = path.resolve('src', 'devDummyData');
	if (!fs.existsSync(dummyDataLocation)) {
		fs.mkdirSync(dummyDataLocation);
	}
	const BBB = new PresentationInfo(presentationUrl);
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
