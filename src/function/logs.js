const config = require('../../config.json');
/**
 * Simple function for tracking steps during debugging
 * @param {String} message 
 */
function log(message) {
	// eslint-disable-next-line no-undef
	if (config.consoleLogStatus) {
		console.log(`[${(new Date()).toLocaleTimeString()}] ${message}`);
	}
}

module.exports = log;