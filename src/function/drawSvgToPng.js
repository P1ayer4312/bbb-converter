const { XMLBuilder } = require('fast-xml-parser');
const Jimp = require('jimp');
const { parentPort } = require('node:worker_threads');
const { createCanvas, loadImage } = require('canvas');
const xmlBuilder = new XMLBuilder({
	ignoreAttributes: false,
	attributeNamePrefix: '',
});

/**
 * Function for generating png images from svg string
 * @param {number} width - svg width
 * @param {number} height - svg height
 * @param {number} videoWidth - export width
 * @param {number} videoHeight - export height
 * @param {object} data - xml js object
 * @param {string} path - where to be saved
 */
async function drawSvgToPng(
	width,
	height,
	videoWidth,
	videoHeight,
	data,
	path
) {
	parentPort.postMessage(`Drawing ${data.id}`);
	return new Promise(async (resolve, reject) => {
		let pngBuffer;

		if (data.image) {
			pngBuffer = await convertToPngBuffer(data, 'poll', width, height);
		} else {
			/** @type {string} */
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
				xmlString = xmlString.replace(
					'></text>',
					`>${data.text.textValue}</text>`
				);
			}
			const dataUrl =
				`data:image/svg+xml;base64,` +
				Buffer.from(xmlString).toString('base64');

			pngBuffer = await convertToPngBuffer(dataUrl, 'shape', width, height);
		}

		const svgImage = await Jimp.read(pngBuffer).catch(reject);
		const newWidth = Math.round((videoHeight * width) / height);
		new Jimp(videoWidth, videoHeight, async (err, newImage) => {
			if (err) {
				console.log(err);
				reject(err);
			}
			svgImage.resize(Jimp.AUTO, videoHeight);
			const xOffset = Math.abs((videoWidth - newWidth) / 2);
			await newImage
				.composite(svgImage, xOffset, 0)
				.writeAsync(path)
				.then(resolve);
		});
	});
}

/**
 * @param {object} data
 * @param {('shape'|'poll')} type
 * @param {number} width
 * @param {number} height
 */
async function convertToPngBuffer(data, type, width, height) {
	let buffer;
	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext('2d');
	if (type === 'shape') {
		buffer = await loadImage(data).then((img) => {
			ctx.drawImage(img, 0, 0, img.width, img.height);
			return canvas.toBuffer('image/png');
		});
	} else if (type === 'poll') {
		buffer = await loadImage(data.image.href).then((img) => {
			ctx.drawImage(
				img,
				parseInt(data.image.x),
				parseInt(data.image.y),
				parseInt(data.image.width),
				parseInt(data.image.height)
			);
			return canvas.toBuffer('image/png');
		});
	}

	return buffer;
}

module.exports = drawSvgToPng;
