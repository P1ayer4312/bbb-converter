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
 * @returns
 */
function fetchXMLfile(url, rawXMLformat) {
	logs(`Fetching ${url}`, 'cyan');
	return axios
		.get(url)
		.then((res) => {
			if (rawXMLformat) {
				return res.data;
			}

			return xmlParser.parse(res.data);
		})
		.catch(() => {
			throw new Error('Failed ' + url);
		});
}

module.exports = fetchXMLfile;
