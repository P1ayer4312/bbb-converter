// eslint-disable-next-line no-unused-vars
const T = require('../types/typedefs');
const logs = require('../function/logs');
const path = require('node:path');
const fs = require('node:fs');
const createWorker = require('../function/createWorker');
const executeCommand = require('../function/executeCommand');
const config = require('../../config.json');
const createShapeExportProcesses = require('../function/createShapeExportProcesses');

/**
 * Wrapper class for managing and sorting slides' data
 */
class DataSorter {
	/* =========================================================================== */

	constructor() {
		logs('Creating "DataSorter" instance', 'yellow');
		/**@type {T.Slide[] | null} */
		this.slides = null;
		/** @type {T.SharescreenChunks[] | []} */
		this.shareScreenChunks = [];
	}

	/* =========================================================================== */

	/**
	 * Map slides values from the shapes xml file and store them
	 * @param {T.PresentationInfo} presentation
	 */
	mapSlidesInfo(presentation) {
		const shapesXml = presentation.xmlFiles.slidesXml;
		const slides = [];
		logs('Mapping slides data', 'cyan');
		if (Array.isArray(shapesXml.svg.image)) {
			for (let image of shapesXml.svg.image) {
				// Skip placeholder images used where screen sharing takes place
				const imageHref = image['xlink:href'];
				if (imageHref == 'presentation/deskshare.png') {
					continue;
				}
				/**@type {T.Slide} */
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
		}

		this.slides = slides;
	}

	/* =========================================================================== */

	/**
	 * Groups cursors by slide start and end
	 * @param {T.PresentationInfo} presentation
	 */
	groupCursorsByTime(presentation) {
		// Parse xml cursors
		logs('Grouping cursor data per slide', 'cyan');
		const cursorsHolder = [];
		const events = presentation.xmlFiles.cursorXml.recording.event;
		const panZoomEvents = presentation.xmlFiles.panZoomsXml.recording.event;
		/** @type {T.PanZoom[]} */
		const panZoomHolder = [];

		for (let n = 0; n < panZoomEvents.length - 1; n++) {
			const el = panZoomEvents[n];
			const nextEl = panZoomEvents[n + 1];
			const viewBoxParts = el.viewBox
				.split(' ')
				.map((item) => Number(Number(item).toFixed(2)));

			/**	@type {T.PanZoom} */
			const event = {
				timestamp: {
					start: Number(el.timestamp),
					end: nextEl
						? Number(Number(nextEl.timestamp).toFixed(1))
						: presentation.duration,
				},
				viewBox: {
					x: viewBoxParts[0],
					y: viewBoxParts[1],
					width: viewBoxParts[2],
					height: viewBoxParts[3],
				},
			};

			panZoomHolder.push(event);
		}

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

			// const panZoom = panZoomHolder.filter((el) => {
			// 	return (
			// 		slide.timestamp.start <= el.timestamp.start ||
			// 		slide.timestamp.end >= el.timestamp.end
			// 	);
			// });

			slide.cursors = cursors.length > 0 ? cursors : null;
			slide.panZoom = panZoomHolder.length > 0 ? panZoomHolder : null;
		}
	}

	/* =========================================================================== */

	/**
	 * Extract and download audio from webcam
	 * @param {T.PresentationInfo} presentation
	 * @returns {Promise<void>}
	 */
	async downloadAudio(presentation) {
		return await new Promise((resolve) => {
			const fileLocation = path.resolve(presentation.dataLocation, 'AUDIO.mp3');
			if (fs.existsSync(fileLocation)) {
				resolve();
				return;
			}

			logs('Downloading audio', 'cyan');
			const ffmpegCommand = `ffmpeg -y -i ${presentation.videoFilesUrls.webcams} -vn ${fileLocation}`;

			executeCommand(ffmpegCommand);
			logs('Audio download complete', 'magenta');
			resolve();
		});
	}

	/* =========================================================================== */

	/**
	 * Download presentation slides as Worker
	 * @param {string} downloadFolder
	 * @param {T.Resolution} resolution
	 */
	downloadSlidesWorker(downloadFolder, resolution) {
		return createWorker(
			'./src/worker/downloadSlidesWorker.js',
			{
				downloadFolder,
				resolution,
				slides: this.slides,
			},
			'Downloading slides complete'
		);
	}

	/* =========================================================================== */

	/**
	 * Export drawn shapes from svg to png format as separate Node process
	 * @param {T.PresentationInfo} presentation
	 * @param {T.Resolution} resolution
	 */
	exportShapesToPngProcess(presentation, resolution) {
		if (this.slides.length > 0) {
			return createShapeExportProcesses({
				filePath: path.resolve('src', 'process', 'exportShapesToPngProcess.js'),
				resolution,
				slides: this.slides,
				presentation,
			});
		} else {
			logs('No slides found', 'magenta');
			return Promise.resolve();
		}
	}

	/* =========================================================================== */

	/**
	 * Extract and download audio from webcam as Worker
	 * @param {T.PresentationInfo} presentation
	 * @returns {Promise<void>}
	 */
	downloadAudioWorker(presentation) {
		return createWorker(
			'./src/worker/downloadAudioWorker.js',
			{
				presentation,
			},
			'Audio download complete'
		);
	}

	/* =========================================================================== */

	/**
	 * Download sharescreen parts as Worker
	 * @param {T.PresentationInfo} presentation
	 * @param {T.Resolution} resolution
	 */
	async downloadSharescreenWorker(presentation, resolution) {
		return createWorker(
			'./src/worker/downloadSharescreenWorker.js',
			{
				presentation,
				resolution,
			},
			'Sharescreen download complete',
			(data) => {
				this.shareScreenChunks = data;
			}
		);
	}

	/* =========================================================================== */

	/**
	 * Create an info file with the presentation name, url and
	 * presentation timestamps
	 * @param {T.PresentationInfo} presentation
	 * @param {string} presentationLink
	 */
	createInfoFile(presentation, presentationLink) {
		logs('Creating presentation info file', 'cyan');

		function getFormattedTime(value) {
			const time = Number(value);
			const formatPart = (part) => (part < 10 ? `0${part}` : part);
			const hours = parseInt(time / 3600);
			const minutes = parseInt((time - hours * 3600) / 60);
			const seconds = Math.round(time % 60);
			return `${hours}:${formatPart(minutes)}:${formatPart(seconds)}`;
		}

		const slides = presentation.xmlFiles.slidesXml.svg.image;
		const timestamps = [];

		for (let n = 0; n < slides.length; n++) {
			const slide = slides[n];
			let slideName;
			if (slide['xlink:href'] == 'presentation/deskshare.png') {
				slideName = `${slide.id.substring(5)} - Share screen`;
			} else {
				slideName = `${slide.id.substring(5)} - Slide`;
			}

			timestamps.push(`${getFormattedTime(slide.in)} | ${slideName}`);
		}

		const infoFileTemplate =
			`${presentation.getFullName()}\n` +
			`${presentationLink}\n\n` +
			`Conversion time: ${presentation.getConversionDuration()}` +
			(timestamps.length > 0
				? `\n\nTimestamps:\n` + `${timestamps.join('\n')}`
				: '');

		fs.writeFileSync(
			path.resolve(presentation.folderLocation, `presentation_info.txt`),
			infoFileTemplate
		);
	}

	/* =========================================================================== */

	/**
	 * Remove unused files after the final video is exported
	 * @param {T.PresentationInfo} presentation
	 */
	cleanUp(presentation) {
		if (config.cleanUpWhenDone) {
			logs('Cleaning up unused files...', 'cyan');
			fs.rmSync(presentation.dataLocation, { recursive: true, force: true });
			fs.rmSync(presentation.shapesLocation, { recursive: true, force: true });
		}

		logs(`Done!`, 'green');
	}

	/* =========================================================================== */
}

module.exports = DataSorter;
