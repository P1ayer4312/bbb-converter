const config = require('../../config.json');
const chalk = require('chalk');
/**
 * Simple function for tracking steps during debugging
 * @param {string} message Message to be logged
 * @param {Colors} color Text color
 * @typedef {('cyan'|'yellow'|'magenta'|'green'|'red'|'gray')} Colors
 */
function log(message, color) {
	// eslint-disable-next-line no-undef
	if (config.consoleLogStatus) {
		let chosenColor;
		switch (color) {
			case 'cyan':
				chosenColor = chalk.cyan;
				break;
			case 'green':
				chosenColor = chalk.green;
				break;
			case 'magenta':
				chosenColor = chalk.magenta;
				break;
			case 'yellow':
				chosenColor = chalk.yellow;
				break;
			case 'red':
				chosenColor = chalk.red;
				break;
			case 'gray':
				chosenColor = chalk.gray;
				break;
			default:
				chosenColor = chalk.gray;
		}

		// eslint-disable-next-line no-console
		console.log(
			`[${chalk.blue(new Date().toLocaleTimeString())}] ` +
				`${chosenColor(message)} `
		);
	}
}

module.exports = log;
