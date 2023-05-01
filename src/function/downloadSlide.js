const axios = require('axios');
const fs = require('node:fs');
const path = require('node:path');
const logs = require('./logs');

/**
 * Function for downloading slide image
 * @param {String} url 
 * @param {String} downloadFolder
 * @returns {Promise<void>}
 */
async function downloadSlide(url, downloadFolder) {
	const imageName = url.substring(url.lastIndexOf('/') + 1);
	const fileLocation = path.resolve(downloadFolder, imageName);
	if (fs.existsSync(fileLocation)) {
		// Skip if slide exists
		return;
	}
	const writer = fs.createWriteStream(fileLocation);
	logs(`Downloading ${url}`);
	const response = await axios({
		url,
		method: 'get',
		responseType: 'stream',
	});
	response.data.pipe(writer);

	return new Promise((resolve, reject) => {
		writer.on('finish', resolve);
		writer.on('error', reject);
	});
}

module.exports = downloadSlide;