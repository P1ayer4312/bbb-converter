const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });

/**
 * Fetch XML file and return JS object
 * @param {String} url 
 * @returns 
 */
function fetchXMLfile(url) {
	return new Promise((resolve) => {
		axios.get(url)
			.then(res => {
				resolve(
					xmlParser.parse(res.data)
				)
			})
			.catch(() => {
				throw new Error('Failed ' + url);
			});
	});
}

module.exports = fetchXMLfile;