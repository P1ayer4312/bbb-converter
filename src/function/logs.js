const config = require('../../config.json');
const chalk = require('chalk');
/**
 * Simple function for tracking steps during debugging
 * @param {string} message
 * @param {('cyan'|'yellow'|'magenta'|'green'|'red')} color
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
			default:
				chosenColor = chalk.gray;
		}

		console.log(
			`[${chalk.blue(new Date().toLocaleTimeString())}] ` +
				`${chosenColor(message)} `
		);
	}
}

module.exports = log;
