const { execSync } = require('node:child_process');
const config = require('../../config.json');

function executeCommand(command) {
	execSync(command, {
		stdio: config.ffmpegStatus ? 'inherit' : 'ignore',
	});
}

module.exports = executeCommand;