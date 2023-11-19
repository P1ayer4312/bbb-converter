const { fork } = require('node:child_process');
const config = require('../../config.json');
const logs = require('./logs');
const T = require('../types/typedefs');

/**
 * Function for creating child processes
 * @param {T.CreateShapeExportProcessesProps} param0
 */
function createShapeExportProcesses({ filePath, resolution, slides }) {
	const numProcesses = config.numShapesExportProcesses ?? 1;
	const promisesArray = [];

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
			})
		);
	}

	return Promise.allSettled(promisesArray);
}

module.exports = createShapeExportProcesses;
