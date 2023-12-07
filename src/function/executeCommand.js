const { execSync } = require('node:child_process');
const config = require('../../config.json');

/**
 * Execute shell command
 * @param {string} command
 */
function executeCommand(command) {
	execSync(command, {
		stdio: config.ffmpegStatus ? 'inherit' : 'ignore',
	});
}

module.exports = executeCommand;
