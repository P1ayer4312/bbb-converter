const { parentPort, workerData } = require('node:worker_threads');
const path = require('node:path');
const fs = require('node:fs');
const drawSvgToPng = require('../function/drawSvgToPng');
const patchSvg = require('../function/patchSvg');
// eslint-disable-next-line no-unused-vars
const T = require('../types/typedefs');
// eslint-disable-next-line no-unused-vars
const PresentationInfo = require('../class/PresentationInfo');
const sliceArrayToMultiple = require('../function/sliceArrayToMultiple');
const config = require('../../config.json');

/**
 * Export drawn shapes from svg to png format
 * @param {PresentationInfo} presentation
 * @param {T.Resolution} resolution
 * @param {T.Slide[] | null} slides
 * @param {number} sliceIndex
 */
async function exportShapesToPngFunc(
	presentation,
	resolution,
	slides,
	sliceIndex
) {
	parentPort.postMessage('Drawing shapes to png format');
	let postExit = false;
	const shapesSvg = presentation.xmlFiles.slidesXml.svg.g;
	const slidesWithShapes = slides.filter((el) => el.shapes !== null);
	if (Array.isArray(shapesSvg)) {
		let newShapesSvg = shapesSvg;
		if (sliceIndex !== -1) {
			const sliceLength = Math.ceil(
				shapesSvg.length / config.numShapesExportWorkers // TODO: Remove
			);
			const slicedShapes = sliceArrayToMultiple(shapesSvg, sliceLength);
			newShapesSvg = slicedShapes[sliceIndex] || [];
		}
		for await (let shape of newShapesSvg) {
			shape.display = '';
			if (Array.isArray(shape.g)) {
				for (let svg of shape.g) {
					const filePath = path.resolve(
						presentation.shapesLocation,
						`${svg.id}.png`
					);
					if (fs.existsSync(filePath)) {
						parentPort.postMessage(`Skipping ${svg.id}, file exists`);
						continue;
					}

					if (!postExit) {
						postExit = true;
					}

					patchSvg(svg, presentation);
					const parentSlide = slidesWithShapes.find(
						(el) => el.id == shape.image
					);
					await drawSvgToPng(
						parentSlide.resolution.width,
						parentSlide.resolution.height,
						resolution.width,
						resolution.height,
						svg,
						filePath
					);
				}
			} else {
				const svg = shape.g;
				const filePath = path.resolve(
					presentation.shapesLocation,
					`${svg.id}.png`
				);
				if (fs.existsSync(filePath)) {
					parentPort.postMessage(`Skipping ${svg.id}, file exists`);
					continue;
				}

				if (!postExit) {
					postExit = true;
				}

				patchSvg(svg, presentation);
				const parentSlide = slidesWithShapes.find((el) => el.id == shape.image);
				await drawSvgToPng(
					parentSlide.resolution.width,
					parentSlide.resolution.height,
					resolution.width,
					resolution.height,
					svg,
					filePath
				);
			}
		}
	}

	if (postExit) {
		parentPort.postMessage({ exit: true });
	}
}

exportShapesToPngFunc(
	workerData.presentation,
	workerData.resolution,
	workerData.slides,
	workerData.sliceIndex
);
