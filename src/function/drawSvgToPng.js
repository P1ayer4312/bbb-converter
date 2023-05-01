const { XMLBuilder } = require('fast-xml-parser');
const Jimp = require('jimp');
const svg2img = require('svg2img');
const logs = require('../function/logs');
const xmlBuilder = new XMLBuilder({
	ignoreAttributes: false,
	attributeNamePrefix: '',
});

/**
 * Function for generating png images from svg string
 * @param {Number} width - svg width
 * @param {Number} height - svg height
 * @param {Number} videoWidth - export width
 * @param {Number} videoHeight - export height
 * @param {Object} data - xml js object
 * @param {String} path - where to be saved
 */
async function drawSvgToPng(
	width,
	height,
	videoWidth,
	videoHeight,
	data,
	path
) {
	const xmlString = xmlBuilder.build({
		svg: {
			xmlns: 'http://www.w3.org/2000/svg',
			version: '1.1',
			width: width.toString(),
			height: height.toString(),
			viewBox: `0 0 ${width} ${height}`,
			g: data,
		},
	});

	const newWidth = Math.round((videoHeight * width) / height);
	logs(`Drawing ${data.id}`);
	return await new Promise((resolve) => {
		svg2img(xmlString, async (err, buffer) => {
			Jimp.read(buffer).then((image) => {
				image.resize(newWidth, videoHeight).write(path);
				resolve();
			});
		});
	});
}

module.exports = drawSvgToPng;
