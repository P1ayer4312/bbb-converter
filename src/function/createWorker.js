const { Worker } = require('node:worker_threads');
const logs = require('./logs');
/**
 * Create new worker
 * @param {String} workerFileLocation
 * @param {Object} workerData
 * @param {String} workerEndMessage
 * @param {Function} callback
 */
async function createWorker(
	workerFileLocation,
	workerData,
	workerEndMessage,
	callback
) {
	return await new Promise((resolve, reject) => {
		const worker = new Worker(workerFileLocation, {
			workerData,
		});

		worker.on('message', (data) => {
			if (callback && typeof data === 'object') {
				callback(data);
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
			logs(workerEndMessage, 'magenta');
			logs(`Worker stopped: ${workerFileLocation}`);
			resolve(workerEndMessage);
		});
	});
}

module.exports = createWorker;
