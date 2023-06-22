const { parentPort, workerData } = require('node:worker_threads');
const path = require('node:path');
const fs = require('node:fs');
const drawSvgToPng = require('../function/drawSvgToPng');
const patchSvg = require('../function/patchSvg');
// eslint-disable-next-line no-unused-vars
const typedefs = require('../types/typedefs');
// eslint-disable-next-line no-unused-vars
const PresentationInfo = require('../class/PresentationInfo');

/**
 * Export drawn shapes from svg to png format
 * @param {PresentationInfo} presentation
 * @param {typedefs.Resolution} resolution
 * @param {Array.<typedefs.Slide>|null} slides
 */
async function exportShapesToPngFunc(presentation, resolution, slides) {
	parentPort.postMessage('Drawing shapes to png format');
	const shapesSvg = presentation.xmlFiles.slidesXml.svg.g;
	const slidesWithShapes = slides.filter((el) => el.shapes !== null);

	if (Array.isArray(shapesSvg)) {
		for (let shape of shapesSvg) {
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

					await patchSvg(svg, presentation);
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
			} 
			else {
				const svg = shape.g;
				const filePath = path.resolve(
					presentation.shapesLocation,
					`${svg.id}.png`
				);
				if (fs.existsSync(filePath)) {
					parentPort.postMessage(`Skipping ${svg.id}, file exists`);
					continue;
				}
				await patchSvg(svg, presentation).catch(console.log);
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
}

exportShapesToPngFunc(
	workerData.presentation,
	workerData.resolution,
	workerData.slides
);