const axios = require('axios');
const { Buffer } = require('node:buffer');
/**
 * Fetch SVG and convert it to Base64
 * @param {String} url
 * @returns
 */
function fetchSvgToBase64(url) {
	return axios
		.get(url, {
			responseType: 'arraybuffer',
		})
		.then((response) => {
			return (
				'data:image/svg+xml;base64,' +
				Buffer.from(response.data, 'binary').toString('base64')
			);
		});
}

module.exports = fetchSvgToBase64;
