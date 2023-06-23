const { XMLBuilder } = require('fast-xml-parser');
const Jimp = require('jimp');
const svgToImg = require('svg-to-img');
const logs = require('../function/logs');
const { parentPort } = require('node:worker_threads');
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
	/** @type {String} */
	let xmlString = xmlBuilder.build({
		svg: {
			xmlns: 'http://www.w3.org/2000/svg',
			version: '1.1',
			width: width.toString(),
			height: height.toString(),
			viewBox: `0 0 ${width} ${height}`,
			g: data,
		},
	});

	// There's a bug inside XMLBuilder that causes node values to
	// not be built properly, so we need to manually fix them :/
	if (xmlString.includes('textValue')) {
		xmlString = xmlString.replace('></text>', `>${data.text.textValue}</text>`);
	}

	parentPort.postMessage(`Drawing ${data.id}`);

	const svgImg = await svgToImg.from(xmlString).toPng();
	const newWidth = Math.round((videoHeight * width) / height);
	new Jimp(videoWidth, videoHeight, async (err, newImage) => {
		if (err) {
			console.log(err);
		}
		const svgImage = await Jimp.read(svgImg);
		svgImage.resize(Jimp.AUTO, videoHeight);
		const xOffset = Math.abs((videoWidth - newWidth) / 2);
		newImage.composite(svgImage, xOffset, 0).write(path);
	});
}

module.exports = drawSvgToPng;
