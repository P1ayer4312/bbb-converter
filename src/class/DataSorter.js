// eslint-disable-next-line no-unused-vars
const PresentationInfo = require('./PresentationInfo');
const drawSvgToPng = require('../function/drawSvgToPng');
const path = require('node:path');

/**
 * Wrapper class for managing and sorting slides' data
 */
class DataSorter {
	constructor() {
		this.slides = null;
	}
	/**
	 * Map slides values from the shapes xml file and store them
	 * @param {PresentationInfo} presentation
	 */
	mapSlidesInfo(presentation) {
		const shapesXml = presentation.xmlFiles.slidesXml;
		const slides = [];
		for (let image of shapesXml.svg.image) {
			const slideInfo = {
				id: image.id,
				timestamp: {
					start: parseFloat(image.in),
					end: parseFloat(image.out),
				},
				resolution: {
					width: parseInt(image.width),
					height: parseInt(image.height),
				},
				url: `${presentation.filesUrl}/${image['xlink:href']}`,
				shapes: null,
				cursor: null,
			};

			const shapes = shapesXml.svg.g.find((el) => el.image == image.id);
			if (shapes) {
				const shapesInfo = [];
				if (Array.isArray(shapes.g)) {
					for (let shape of shapes.g) {
						const temp = {
							id: shape.id,
							timestamp: {
								start: parseFloat(shape.timestamp),
								end:
									shape.undo == '-1'
										? slideInfo.timestamp.end
										: parseFloat(shape.undo),
							},
							location: path.resolve(
								presentation.shapesLocation,
								`${shape.id}.png`
							),
						};

						shapesInfo.push(temp);
					}
				} else {
					const shape = shapes.g;
					const temp = {
						id: shape.id,
						timestamp: {
							start: parseFloat(shape.timestamp),
							end:
								shape.undo == '-1'
									? slideInfo.timestamp.end
									: parseFloat(shape.undo),
						},
						location: path.resolve(
							presentation.shapesLocation,
							`${shape.id}.png`
						),
					};

					shapesInfo.push(temp);
				}

				slideInfo.shapes = shapesInfo;
			}

			slides.push(slideInfo);
		}

		this.slides = slides;
		require('node:fs').writeFileSync('test_data.json', JSON.stringify(slides));
	}
	/**
	 * Export drawn shapes from svg to png format
	 * @param {PresentationInfo} presentation
	 */
	async exportShapesToPng(presentation) {
		const shapesSvg = presentation.xmlFiles.slidesXml.svg.g;
		const slidesWithShapes = this.slides.filter((el) => el.shapes !== null);
		for (let shape of shapesSvg) {
			if (Array.isArray(shape.g)) {
				for (let svg of shape.g) {
					svg.style = svg.style.replace('visibility:hidden', '');
					const parentSlide = slidesWithShapes.find(
						(el) => el.id == shape.image
					);
					await drawSvgToPng(
						parentSlide.resolution.width,
						parentSlide.resolution.height,
						parentSlide.resolution.width,
						parentSlide.resolution.height,
						svg,
						path.resolve(presentation.shapesLocation, `${svg.id}.png`)
					);
					console.log(svg.id);
				}
			} else {
				const svg = shape.g;
				const parentSlide = slidesWithShapes.find((el) => el.id == shape.image);
				await drawSvgToPng(
					parentSlide.resolution.width,
					parentSlide.resolution.height,
					parentSlide.resolution.width,
					parentSlide.resolution.height,
					svg,
					path.resolve(presentation.shapesLocation, `${svg.id}.png`)
				);
				console.log(svg.id);
			}
		}
	}
}

module.exports = DataSorter;

// slides = [
// 	{
// 		id: 'image9',
// 		timestamp: {
// 			start: 0.0,
// 			end: 10.9,
// 		},
// 		resolution: {
// 			width: 1600,
// 			height: 1200,
// 		},
// 		url: 'http://DOMAIN/SLIDE_LOCATION',
// 		shapes: [
// 			{
// 				id: 'image9-draw1',
// 				timestamp: {
// 					start: 916.1,
// 					end: -1 ? this.timestamp.end : 1132.0,
// 				},
// 				location: 'PRESENTATION_FOLDER/shapes'
// 			},
// 		],
// 	},
// ];
