const { workerData } = require('node:worker_threads');
const downloadSlide = require('../function/downloadSlide');
const logs = require('../function/logs');
// eslint-disable-next-line no-unused-vars
const typedefs = require('../types/typedefs');

/**
 * Download presentation slides as Worker
 * @param {String} downloadFolder
 * @param {typedefs.Resolution} resolution
 * @param {Array.<typedefs.Slide>|null} slides
 */
async function downloadSlides(downloadFolder, resolution, slides) {
	if (slides === null) {
		logs('No slides detected', 'magenta');
	} else {
		logs('Downloading slides', 'cyan');
		for (let slide of slides) {
			await downloadSlide(slide.url, downloadFolder, resolution.height);
		}
	}
}

downloadSlides(
	workerData.downloadFolder,
	workerData.resolution,
	workerData.slides
);