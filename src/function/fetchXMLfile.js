const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
const logs = require('./logs');

/**
 * Fetch XML file and return JS object
 * @param {String} url 
 * @returns 
 */
function fetchXMLfile(url) {
	logs(`Fetching ${url}`);
	return axios.get(url)
		.then(res => xmlParser.parse(res.data))
		.catch(() => {
			throw new Error('Failed ' + url);
		});
}

module.exports = fetchXMLfile;