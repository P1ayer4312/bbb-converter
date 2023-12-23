const path = require('node:path');
const fs = require('node:fs');
const logs = require('../function/logs');
const drawSvgToPng = require('../function/drawSvgToPng');
const patchSvg = require('../function/patchSvg');
// eslint-disable-next-line no-unused-vars
const T = require('../types/typedefs');

/**
 * Export drawn shapes from svg to png format
 * @type {T.ExportShapesToPngFuncProps}
 */
async function exportShapesToPngFunc(presentation, resolution, slides) {
	logs('Drawing shapes to png format', 'cyan');
	const shapesSvg = presentation.xmlFiles.slidesXml.svg.g;
	const slidesWithShapes = slides?.filter((el) => el.shapes !== null) ?? [];
	if (Array.isArray(shapesSvg)) {
		for await (let shape of shapesSvg) {
			shape.display = '';
			if (Array.isArray(shape.g)) {
				for (let svg of shape.g) {
					const filePath = path.resolve(
						presentation.shapesLocation,
						`${svg.id}.png`
					);
					if (fs.existsSync(filePath)) {
						logs(`Skipping ${svg.id}, file exists`, 'red');
						continue;
					}

					patchSvg(svg, presentation);
					const parentSlide = slidesWithShapes.find(
						(el) => el.id == shape.image
					);

					if (!parentSlide) {
						continue;
					}

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
					logs(`Skipping ${svg.id}, file exists`, 'red');
					continue;
				}

				patchSvg(svg, presentation);
				const parentSlide = slidesWithShapes.find((el) => el.id == shape.image);

				if (!parentSlide) {
					continue;
				}

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

process.on('message', async (data) => {
	await exportShapesToPngFunc(data.presentation, data.resolution, data.slides);
	process.exit(0);
});
