const { XMLBuilder } = require('fast-xml-parser');
const Jimp = require('jimp');
const logs = require('./logs');
const { Buffer } = require('node:buffer');
const { createCanvas, loadImage, Image } = require('canvas');
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
	logs(`Drawing ${data.id}`, 'cyan');
	// eslint-disable-next-line no-async-promise-executor
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
		buffer = await loadImage(data.image.href).then(async (img) => {
			// The poll is stored rotated for some reason and I ain't gonna
			// do the math thing, so imma let ma boi Jimp do the rotation
			const pollWidth = parseInt(data.image.width);
			const pollHeight = parseInt(data.image.height);
			const pollCanvas = createCanvas(pollWidth, pollHeight);
			const pollCanvasCtx = pollCanvas.getContext('2d');

			pollCanvasCtx.fillStyle = 'white';
			pollCanvasCtx.fillRect(0, 0, pollWidth, pollHeight);
			pollCanvasCtx.drawImage(img, 0, 0, pollWidth, pollHeight);

			const pollJimp = await Jimp.read(pollCanvas.toBuffer('image/png'));
			const pollImg = new Image();

			if (data.image.transform) {
				pollJimp.rotate(270);
			}

			pollImg.src = await pollJimp.getBase64Async(Jimp.MIME_PNG);

			if (data.image.transform) {
				ctx.drawImage(
					pollImg,
					width - pollHeight,
					height - pollWidth,
					pollHeight,
					pollWidth
				);
			} else {
				// If the image wasn't rotated, draw it normally
				ctx.drawImage(
					pollImg,
					width - pollWidth,
					height - pollHeight,
					pollWidth,
					pollHeight
				);
			}

			return canvas.toBuffer('image/png');
		});
	}

	return buffer;
}

module.exports = drawSvgToPng;
