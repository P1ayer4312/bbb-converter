const { loadImage, createCanvas } = require('canvas');
/**
 * Fetch SVG and convert it to Base64 PNG format
 * @param {string} url
 * @param {string} fallbackUrl
 * @returns {Promise<String>}
 */
async function fetchSvgToBase64(url, fallbackUrl) {
	return await new Promise((resolve, reject) => {
		fetchUrl(url, resolve, () => {
			fetchUrl(fallbackUrl, resolve, () => {
				reject(new Error(`Unable to fetch svg: ${fallbackUrl}`));
			});
		});
	});
}
/**
 * @param {string} url
 * @param {function()} resolve
 * @param {function()} rejectCallback
 */
function fetchUrl(url, resolve, rejectCallback) {
	return loadImage(url)
		.then((img) => {
			const canvas = createCanvas(img.width, img.height);
			const ctx = canvas.getContext('2d');
			ctx.drawImage(img, 0, 0, img.width, img.height);
			const dataUrl = canvas.toDataURL('image/jpeg');
			resolve(dataUrl);
		})
		.catch(rejectCallback);
}

module.exports = fetchSvgToBase64;
