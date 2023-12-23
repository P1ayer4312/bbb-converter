const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const xmlParser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '',
});
const logs = require('./logs');

/**
 * Fetch XML file and return JS object
 * @param {string} url
 * @param {boolean} rawXMLformat
 */
function fetchXMLfile(url, rawXMLformat) {
	logs(`Fetching ${url}`, 'cyan');
	return axios
		.get(url)
		.then((res) => {
			if (rawXMLformat) {
				return res.data;
			}

			// We have to replace the <br/> tag here with a placeholder because
			// fast-xml-parser is stupid and causes problems
			return xmlParser.parse(res.data.replace(/<br\s*\/?>/g, '[[br/]]'));
		})
		.catch(() => {
			throw new Error('Failed ' + url);
		});
}

module.exports = fetchXMLfile;
