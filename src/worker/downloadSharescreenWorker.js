const { workerData, parentPort } = require('node:worker_threads');
const path = require('node:path');
const fs = require('node:fs');
const logs = require('../function/logs');
const executeCommand = require('../function/executeCommand');
// eslint-disable-next-line no-unused-vars
const typedefs = require('../types/typedefs');

const shareScreenChunks = [];

/**
 * Download sharescreen parts
 * @param {PresentationInfo} presentation
 * @param {typedefs.Resolution} resolution
 * @returns {Promise<void>}
 */
async function downloadSharescreen(presentation, resolution) {
	/*
	- Because of the way sharescreen is stored, it's just a large file filled
		with empty space with occasional chunks of sharescreen, so we make 
		this function only download those chunks instead of the whole video.
	- If there are no 'chunks' we download the whole video.
	*/
	parentPort.postMessage('Downloading sharescreen chunks');
	return await new Promise((resolve) => {
		if (presentation.xmlFiles.deskshareXml.recording?.event) {
			/**
			 * This part is repeating, so we make it a function
			 * @param {typedefs.DeskshareRecordingEventValues} chunk
			 * @param {Number} index
			 */
			const downloadChunk = (chunk, index) => {
				const fileName = `SCREEN_${index}.mp4`;
				const fileLocation = path.resolve(presentation.dataLocation, fileName);

				if (fs.existsSync(fileLocation)) {
					parentPort.postMessage(`Skipping ${fileName}, file already exists`);
					return;
				}

				const start = Number(chunk.start_timestamp);
				const end = Number(chunk.stop_timestamp);
				const duration = Number((end - start).toFixed(2));
				const ffmpegCommand =
					`ffmpeg -y -i ${presentation.videoFilesUrls.deskshare} -ss ${start} ` +
					`-t ${duration} -r 20 -vf scale=${resolution.width}:${resolution.height} ${fileLocation}`;

				logs(`Downloading ${fileName}`, 'cyan');
				executeCommand(ffmpegCommand);
				shareScreenChunks.push({
					start,
					end,
					duration,
					fileLocation,
					fileName,
				});
			};

			const event = presentation.xmlFiles.deskshareXml.recording.event;
			if (Array.isArray(event)) {
				for (let n = 0; n < event.length; n++) {
					downloadChunk(event[n], n + 1);
				}
			} else {
				downloadChunk(event, 1);
			}
		} else {
			parentPort.postMessage('No sharescreen detected');
		}

		resolve();
	});
}

downloadSharescreen(workerData.presentation, workerData.resolution);
parentPort.postMessage(shareScreenChunks);
