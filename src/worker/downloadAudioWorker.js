const { parentPort, workerData } = require('node:worker_threads');
const path = require('node:path');
const fs = require('node:fs');
const executeCommand = require('../function/executeCommand');

/**
 * Extract and download audio from webcam
 * @param {PresentationInfo} presentation
 * @returns {Promise<void>}
 */
async function downloadAudio(presentation) {
	return await new Promise((resolve) => {
		const fileLocation = path.resolve(presentation.dataLocation, 'AUDIO.mp3');
		if (fs.existsSync(fileLocation)) {
			parentPort.postMessage('Skipping audio, file already exists');
			resolve();
			return;
		}

		parentPort.postMessage('Downloading audio');
		const ffmpegCommand = `ffmpeg -y -i ${presentation.videoFilesUrls.webcams} -vn ${fileLocation}`;

		executeCommand(ffmpegCommand);
		resolve();
	});
}

downloadAudio(workerData.presentation);
