const { fork } = require('node:child_process');
const config = require('../../config.json');
const logs = require('./logs');
// eslint-disable-next-line no-unused-vars
const T = require('../types/typedefs');
const sliceArrayToMultiple = require('./sliceArrayToMultiple');

/**
 * Function for creating child processes
 * @param {T.CreateShapeExportProcessesProps} param0
 */
function createShapeExportProcesses({
	filePath,
	resolution,
	slides,
	presentation,
}) {
	const numProcesses = config.numShapesExportProcesses ?? 1;
	const promisesArray = [];

	const sliceChunkSize =
		numProcesses > 1 ? Math.ceil(slides.length / numProcesses) : slides.length;

	const slidesChunks = sliceArrayToMultiple(slides, sliceChunkSize);

	for (let i = 0; i < numProcesses; i++) {
		promisesArray.push(
			new Promise((resolve, reject) => {
				const child = fork(filePath);

				child.on('spawn', () => {
					logs(`Process started: [${i}] ${filePath}`);
				});

				child.on('exit', () => {
					logs(`Process stopped: [${i}] ${filePath}`);
					resolve();
				});

				child.on('error', reject);

				// Send slides data to the child process
				child.send({
					presentation,
					resolution,
					slides: slidesChunks[i],
				});
			})
		);
	}

	return Promise.allSettled(promisesArray);
}

module.exports = createShapeExportProcesses;
