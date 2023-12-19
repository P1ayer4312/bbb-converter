const fs = require('node:fs');
const path = require('node:path');
const PresentationInfo = require('../../class/PresentationInfo');

/**
 * Function used for downloading presentation data to use
 * for simulating data during development
 */
async function downloadDummyData() {
	const presentationUrl =
		'https://bbb-lb.finki.ukim.mk/playback/presentation/2.3/61dfb48384f4e231a4d9fb1a500c7c757b9d3b11-1646382711869';

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
