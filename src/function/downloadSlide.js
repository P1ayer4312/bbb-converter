const axios = require('axios').default;
const fs = require('node:fs');
const path = require('node:path');
const { Writable } = require('node:stream');
const { Buffer } = require('node:buffer');
const Jimp = require('jimp');
const logs = require('./logs');

/**
 * Function for downloading slide image
 * @param {String} url
 * @param {String} downloadFolder
 * @param {Number?} videoHeight
 * @returns {Promise<void>}
 */
async function downloadSlide(url, downloadFolder, videoHeight) {
	const imageName = url.substring(url.lastIndexOf('/') + 1);
	const fileLocation = path.resolve(downloadFolder, imageName);
	if (fs.existsSync(fileLocation)) {
		return; // Skip if slide exists
	}

	const chunks = [];
	const writable = new Writable({
		write: (chunk, encoding, next) => {
			chunks.push(chunk);
			next();
		},
	});

	logs(`Downloading ${url}`);
	const response = await axios({
		url,
		method: 'get',
		responseType: 'stream',
	});
	response.data.pipe(writable);

	return new Promise((resolve, reject) => {
		writable.on('finish', () => {
			const imageBuffer = Buffer.concat(chunks);
			Jimp.read(imageBuffer).then((image) => {
				if (videoHeight) {
					image.resize(Jimp.AUTO, videoHeight);
				}
				image.write(fileLocation);
				resolve();
			});
		});
		
		writable.on('error', reject);
	});
}

module.exports = downloadSlide;
