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
			// Skip placeholder images used where screen sharing takes place
			if (image['xlink:href'] == 'presentation/deskshare.png') {
				continue;
			}
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
				/**
				 * @type {Array.<{id: String, timestamp: {start: Number, end: Number}, location: String}>}
				 */
				shapes: null,
				/**
				 * @type {Array.<{timestamp: {start: Number, end: Number}, position: {posX: Number, posY: Number}}>}
				 */
				cursors: null,
			};

			// Check if there are drawn shapes present
			if (shapesXml.svg.g) {
				const shapes = Array.isArray(shapesXml.svg.g)
					? shapesXml.svg.g.find((el) => el.image == image.id)
					: shapesXml.svg.g;

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
			}

			slides.push(slideInfo);
		}

		this.slides = slides;
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
	/**
	 * Groups cursors by slide start and end
	 * @param {PresentationInfo} presentation
	 */
	groupCursorsByTime(presentation) {
		// Parse xml cursors
		const cursorsHolder = [];
		const events = presentation.xmlFiles.cursorXml.recording.event;
		for (let n = 0; n < events.length - 1; n++) {
			const point = events[n];
			const cursorPos = point.cursor.split(' ').map((el) => parseFloat(el));
			if (cursorPos[0] == -1) {
				continue;
			}
			cursorsHolder.push({
				timestamp: {
					start: parseFloat(point.timestamp),
					end: parseFloat(events[n + 1].timestamp),
				},
				position: {
					posX: cursorPos[0],
					posY: cursorPos[1],
				},
			});
		}
		// Group them in their appropriate slides filtered by time
		for (let slide of this.slides) {
			const cursors = cursorsHolder.filter((cursor) => {
				return (
					slide.timestamp.start <= cursor.timestamp.start &&
					slide.timestamp.end >= cursor.timestamp.end
				);
			});

			slide.cursors = cursors.length > 0 ? cursors : null;
		}
	}
}

module.exports = DataSorter;
