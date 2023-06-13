// eslint-disable-next-line no-unused-vars
const PresentationInfo = require('./PresentationInfo');
// eslint-disable-next-line no-unused-vars
const typedefs = require('../types/typedefs');
const drawSvgToPng = require('../function/drawSvgToPng');
const logs = require('../function/logs');
const config = require('../../config.json');
const downloadSlide = require('../function/downloadSlide');
const path = require('node:path');
const fs = require('node:fs');
const { execSync } = require('node:child_process');

/**
 * Wrapper class for managing and sorting slides' data
 */
class DataSorter {
	constructor() {
		logs('Creating "DataSorter" instance');
		/**
		 * @type {Array.<typedefs.Slide>|null}
		 */
		this.slides = null;
		/**
		 * @type {Array.<typedefs.SharescreenChunks>|[]}
		 */
		this.shareScreenChunks = [];
	}
	/**
	 * Map slides values from the shapes xml file and store them
	 * @param {PresentationInfo} presentation
	 */
	mapSlidesInfo(presentation) {
		const shapesXml = presentation.xmlFiles.slidesXml;
		const slides = [];
		logs('Mapping slides data');
		for (let image of shapesXml.svg.image) {
			// Skip placeholder images used where screen sharing takes place
			const imageHref = image['xlink:href'];
			if (imageHref == 'presentation/deskshare.png') {
				continue;
			}
			/**
			 * @type {typedefs.Slide}
			 */
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
				url: `${presentation.filesUrl}/${imageHref}`,
				fileName: imageHref.substring(imageHref.lastIndexOf('/') + 1),
				shapes: null,
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
	 * @param {typedefs.Resolution} resolution
	 */
	async exportShapesToPng(presentation, resolution) {
		console.log('kurac')
		logs('Drawing shapes to png format');
		const shapesSvg = presentation.xmlFiles.slidesXml.svg.g;
		const slidesWithShapes = this.slides.filter((el) => el.shapes !== null);
		for (let shape of shapesSvg.slice(0, 2)) {
			if (Array.isArray(shape.g)) {
				for (let svg of shape.g) {
					const filePath = path.resolve(presentation.shapesLocation, `${svg.id}.png`);
					if (fs.existsSync(filePath)) {
						continue;
					}
					svg.style = svg.style.replace('visibility:hidden', '');
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
				const filePath = path.resolve(presentation.shapesLocation, `${svg.id}.png`);
				if (fs.existsSync(filePath)) {
					continue;
				}
				const parentSlide = slidesWithShapes.find((el) => el.id == shape.image);
				await drawSvgToPng(
					parentSlide.resolution.width,
					parentSlide.resolution.height,
					parentSlide.resolution.width,
					parentSlide.resolution.height,
					svg,
					filePath
				);
			}
		}
		logs('Shapes drawing complete');
	}
	/**
	 * Groups cursors by slide start and end
	 * @param {PresentationInfo} presentation
	 */
	groupCursorsByTime(presentation) {
		// Parse xml cursors
		logs('Grouping cursor data per slide');
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
	/**
	 * Extract and download audio from webcam
	 * @param {PresentationInfo} presentation 
	 * @returns {Promise<void>}
	 */
	async downloadAudio(presentation) {
		return await new Promise((resolve) => {
			const fileLocation = path.resolve(presentation.dataLocation, 'AUDIO.mp3');
			if (fs.existsSync(fileLocation)) {
				resolve();
				return;
			}

			logs('Downloading audio');
			const ffmpegCommand =
				`ffmpeg -y -i ${presentation.videoFilesUrls.webcams} -vn ${fileLocation}`;

			execSync(ffmpegCommand, { stdio: config.consoleLogStatus ? 'inherit' : 'ignore' });
			logs('Audio download complete')
			resolve();
		});
	}
	/**
	 * Download sharescreen parts
	 * @param {PresentationInfo} presentation 
	 * @returns {Promise<void>}
	 */
	async downloadSharescreen(presentation) {
		/*
		- Because of the way sharescreen is stored, it's just a large file filled
			with empty space with occasional chunks of sharescreen, so we make 
			this function only download those chunks instead of the whole video.
		- If there are no 'chunks' we download the whole video.
		*/
		logs('Downloading sharescreen chunks');
		return await new Promise((resolve) => {
			if (presentation.xmlFiles.deskshareXml.recording?.event) {
				/**
				 * This part is repeating, so we make it a function
				 * @param {typedefs.DeskshareRecordingEventValues} chunk 
				 * @param {Number} index
				 */
				const downloadChunk = (chunk, index) => {
					const fileName = `SCREEN_${index}.mp4`;
					const fileLocation = path.resolve(presentation.dataLocation, fileName);

					if (fs.existsSync(fileLocation)) {
						return;
					}

					const start = Number(chunk.start_timestamp);
					const end = Number(chunk.stop_timestamp);
					const duration = Number((end - start).toFixed(1));
					const ffmpegCommand =
						`ffmpeg -i ${presentation.videoFilesUrls.deskshare} -ss ${start} ` +
						`-t ${duration} -vf scale=1920:1080 ${fileLocation}`;

					logs(`Downloading ${fileName}`);
					execSync(ffmpegCommand, { stdio: config.consoleLogStatus ? 'inherit' : 'ignore' });
					this.shareScreenChunks.push({
						start,
						end,
						duration,
						fileLocation,
						fileName
					});
				}

				const event = presentation.xmlFiles.deskshareXml.recording.event;
				if (Array.isArray(event)) {
					for (let n = 0; n < event.length; n++) {
						downloadChunk(event[n], n + 1);
					}
				} else {
					downloadChunk(event, 1);
				}

				logs('Sharescreen download complete');
			} else {
				logs('No sharescreen detected');
			}

			resolve();
		});
	}
	/**
	 * Download presentation slides
	 * @param {String} downloadFolder 
	 * @param {typedefs.Resolution} resolution
	 */
	async downloadSlides(downloadFolder, resolution) {
		if (this.slides === null) {
			logs('No slides detected');
		} else {
			logs('Downloading slides');
			for (let slide of this.slides) {
				await downloadSlide(slide.url, downloadFolder, resolution.height);
			}
		}
	}
}

module.exports = DataSorter;
