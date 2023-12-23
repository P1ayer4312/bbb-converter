// eslint-disable-next-line no-unused-vars
const T = require('../types/typedefs');
const { spawnSync } = require('node:child_process');
const config = require('../../config.json');

/**
 * Execute shell command
 * @param {T.Command} value
 */
function executeCommand(value) {
	spawnSync(value.command, value.args, {
		stdio: config.ffmpegStatus ? 'inherit' : 'ignore',
		cwd: value.cwd ?? undefined,
	});
}

module.exports = executeCommand;
