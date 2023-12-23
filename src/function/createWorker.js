const { Worker } = require('node:worker_threads');
const logs = require('./logs');

/**
 * Create new worker
 * @param {string} workerFileLocation
 * @param {Object} workerData
 * @param {string} workerEndMessage
 * @param {Function} callback
 */
function createWorker(
	workerFileLocation,
	workerData,
	workerEndMessage,
	callback
) {
	return new Promise((resolve, reject) => {
		const worker = new Worker(workerFileLocation, {
			workerData,
		});

		worker.on('message', (data) => {
			if (typeof data === 'object') {
				if (data.exit) {
					worker.emit('exit');
				} else if (callback) {
					callback(data);
				}
			} else {
				logs(data, 'cyan');
			}
		});

		worker.on('error', (error) => {
			console.log(error);
			reject(error);
		});

		worker.on('online', () => {
			logs(`Worker started: ${workerFileLocation}`);
		});

		worker.on('exit', () => {
			worker.terminate();
			logs(workerEndMessage, 'magenta');
			logs(`Worker stopped: ${workerFileLocation}`);
			resolve(workerEndMessage);
		});
	});
}

module.exports = createWorker;
