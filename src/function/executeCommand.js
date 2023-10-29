const { execSync, spawnSync } = require('node:child_process');
const config = require('../../config.json');

/**
 * Execute shell command
 * @param {string} command
 */
function executeCommand(command) {
	try {
		execSync(command, {
			stdio: config.ffmpegStatus ? 'inherit' : 'ignore',
		});
	} catch {
		// Command is too long, go with 'spawnSync'
		// Honestly I'm too lazy to go and change everything to
		// work with spawnSync only
		const cmd = command.split(' ');
		spawnSync(cmd[0], cmd.slice(1), {
			stdio: config.ffmpegStatus ? 'inherit' : 'ignore',
		});
	}
}

module.exports = executeCommand;
