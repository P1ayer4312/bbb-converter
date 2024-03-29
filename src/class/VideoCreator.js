// eslint-disable-next-line no-unused-vars
const T = require('../types/typedefs');
const logs = require('../function/logs');
const fs = require('node:fs');
const path = require('node:path');
const executeCommand = require('../function/executeCommand');
const config = require('../../config.json');
const Helper = require('./Helper');

/**
 * Wrapper class for creating videos
 */
class VideoCreator {
	/* =========================================================================== */

	/** @param {T.Resolution} resolution */
	constructor(resolution) {
		logs('Creating "VideoCreator" instance', 'yellow');
		/** @type {T.Chunk[]} */
		this.sequence = [];
		this.resolution = resolution;
	}

	/* =========================================================================== */

	/**
	 * Generates complex filter files for ffmpeg
	 * @param {T.DataSorter} dataSorter
	 * @param {T.PresentationInfo} presentation
	 */
	createSequence(dataSorter, presentation) {
		for (let slide of dataSorter.slides) {
			const videoChunkLocation = path.resolve(
				presentation.dataLocation,
				`${slide.id}.mp4`
			);

			if (fs.existsSync(videoChunkLocation)) {
				logs(`Skipping ${slide.id}, video chunk exists`, 'red');
				continue;
			}

			/** @type {T.Chunk} */
			const chunk = {};
			const relativePathStartPoint = presentation.shapesLocation;
			// 'offset' is used for correcting chunk timings for elements
			const offset = slide.timestamp.start;
			chunk.height = this.resolution.height;
			chunk.width = Math.round(
				(this.resolution.height * slide.resolution.width) /
					slide.resolution.height
			);
			chunk.timestamp = slide.timestamp;
			// Add padding from the left side of cursors if the slide
			// image width is too small for the wanted resolution
			const padding =
				chunk.width < this.resolution.width
					? (this.resolution.width - chunk.width) / 2
					: 0;
			const complexFilterBuilder = [];
			const inputBuilder = [
				'-i',
				path.relative(relativePathStartPoint, presentation.cursorLocation),
			];

			// Center slide if it's smaller than the desired resolution
			const slideDefs =
				`[0]pad=width=${this.resolution.width}:height=${this.resolution.height}:x=-1:y=-1:color=black,setsar=1,` +
				`scale=${this.resolution.width}:${this.resolution.height}:force_original_aspect_ratio=1[v0];\n[v0]`;

			const shapesDebugFileLocation = path.resolve(
				presentation.dataLocation,
				`${slide.id}_debug.txt`
			);

			const duration = Number(
				(slide.timestamp.end - slide.timestamp.start).toFixed(2)
			);
			// "patch" broken chunks so that they won't break the final video
			chunk.duration = duration < 0 ? 0 : duration;

			const shapesDebugWriter = config.createDebugFiles
				? fs.createWriteStream(shapesDebugFileLocation)
				: null;

			// Check if there are cursors present
			if (slide.cursors !== null) {
				for (let n = 0; n < slide.cursors.length; n++) {
					let cursorX, cursorY;
					const cursor = slide.cursors[n];
					const start = (cursor.timestamp.start - offset).toFixed(2);
					const end = (cursor.timestamp.end - offset).toFixed(2);
					const panZoom =
						slide.panZoom?.find((zoom) => {
							return (
								// i hate my life
								(zoom.timestamp.start <= cursor.timestamp.start &&
									zoom.timestamp.end >= cursor.timestamp.end) ||
								zoom.timestamp.start >= cursor.timestamp.start
							);
						}) ?? null;

					if (panZoom) {
						// Calculate the cursor position on the original resolution, then
						// translate that position to the desired resolution
						const tempCursorX =
							panZoom.viewBox.width * cursor.position.posX + panZoom.viewBox.x;
						const tempCursorY =
							panZoom.viewBox.height * cursor.position.posY + panZoom.viewBox.y;

						cursorX = (
							(tempCursorX / slide.resolution.width) * chunk.width +
							padding
						).toFixed(2);

						cursorY = (
							(tempCursorY / slide.resolution.height) *
							chunk.height
						).toFixed(2);
					} else {
						cursorX = (chunk.width * cursor.position.posX + padding).toFixed(2);
						cursorY = (chunk.height * cursor.position.posY).toFixed(2);
					}

					shapesDebugWriter?.write(
						`${Helper.formatTime(start)} - ${Helper.formatTime(end)}\t | ` +
							`cursor\t\t | X: ${cursorX}\t\t\tY: ${cursorY}\n`
					);

					complexFilterBuilder.push(
						(n === 0 ? slideDefs : `[v${n}]`) +
							`[1:v]overlay=${cursorX}:${cursorY}:enable='between(t,${start},${end})'` +
							(n < slide.cursors.length - 1 ? `[v${n + 1}];\n` : ``)
					);
				}
			} else {
				// Push empty cursor to not break the chain of inputs
				complexFilterBuilder.push(
					`${slideDefs}[1:v]overlay=-20:-20:enable='between(t,0,0)'`
				);
			}

			// Check if there are any shapes present
			if (slide.shapes !== null) {
				shapesDebugWriter?.write('\n');
				const lastCursor = complexFilterBuilder.length;

				for (let n = 0; n < slide.shapes.length; n++) {
					const shape = slide.shapes[n];
					let start = Number((shape.timestamp.start - offset).toFixed(2));
					let end = Number((shape.timestamp.end - offset).toFixed(2));

					if (start < 0 || start > chunk.duration) {
						// Sometimes the offset can be greater than the timestamp,
						// so we just set it as 0 to appear at the chunk duration
						// TODO: Check if the commend and logic are valid
						start = 0;
					}

					if (end < 0 || end > chunk.duration) {
						end = chunk.duration;
					}

					shapesDebugWriter?.write(
						`${Helper.formatTime(start)} - ${Helper.formatTime(end)}\t | ` +
							`${shape.id}\n`
					);

					complexFilterBuilder.push(
						(n === 0
							? `[v${lastCursor}];\n[v${lastCursor}]`
							: `\n[v${lastCursor + n}]`) +
							`[${n + 2}:v]overlay=0:0:enable=` +
							`'between(t,${start},${end})'` +
							(n < slide.shapes.length - 1 ? `[v${lastCursor + n + 1}];` : ``)
					);

					inputBuilder.push(
						'-i',
						path.relative(relativePathStartPoint, shape.location)
					);
				}
			}

			shapesDebugWriter?.close();

			const complexFilterFileLocation = path.resolve(
				presentation.dataLocation,
				`${slide.id}.txt`
			);
			const complexFilterRelativeFileLocation = path.relative(
				relativePathStartPoint,
				complexFilterFileLocation
			);

			const commandJsonFileLocation = path.resolve(
				presentation.dataLocation,
				`${slide.id}_cmd.json`
			);

			const slideImageLocation = path.relative(
				relativePathStartPoint,
				path.resolve(presentation.dataLocation, slide.fileName)
			);

			const videoChunkRelativeLocation = path.relative(
				relativePathStartPoint,
				videoChunkLocation
			);

			chunk.id = slide.id;
			chunk.fileLocation = videoChunkLocation;

			chunk.command = {
				command: 'ffmpeg',
				cwd: relativePathStartPoint,
				args: [
					'-y',
					'-loop',
					'1',
					'-r',
					'20',
					'-i',
					slideImageLocation,
					...inputBuilder,
					'-t',
					chunk.duration,
					'-filter_complex_script',
					complexFilterRelativeFileLocation,
					'-an',
					videoChunkRelativeLocation,
				],
			};

			fs.writeFileSync(
				complexFilterFileLocation,
				complexFilterBuilder.join('')
			);

			if (config.createDebugFiles) {
				fs.writeFileSync(
					commandJsonFileLocation,
					JSON.stringify(chunk.command)
				);
			}

			this.sequence.push(chunk);
		}
	}

	/* =========================================================================== */

	renderChunks() {
		for (let chunk of this.sequence) {
			if (fs.existsSync(chunk.fileLocation)) {
				logs(`Skipping ${chunk.id}, video chunk exists`, 'red');
				continue;
			}
			logs(`Rendering chunk: ${chunk.id}`, 'cyan');
			executeCommand(chunk.command);
		}

		logs('Chunks rendering complete', 'magenta');
	}

	/* =========================================================================== */

	/**
	 * Combines everything into one large video
	 * @param {T.PresentationInfo} presentation
	 */
	finalRender(presentation) {
		const finalFileLocation = path.resolve(
			presentation.folderLocation,
			`${presentation.outputFileName}.mp4`
		);

		// Extract timestamps for each slide / sharescreen from shapes.svg
		logs('Creating chunks concat list', 'yellow');
		let shareScreenCounter = 1;
		const slides = presentation.xmlFiles.slidesXml.svg.image;
		const concatVideosList = [];
		let chunksConcatLocation;

		if (Array.isArray(slides)) {
			for (let slide of slides) {
				let filePath;
				if (slide['xlink:href'] == 'presentation/deskshare.png') {
					filePath = path.resolve(
						presentation.dataLocation,
						`SCREEN_${shareScreenCounter}.mp4`
					);
					shareScreenCounter += 1;
				} else {
					filePath = path.resolve(presentation.dataLocation, `${slide.id}.mp4`);
				}

				concatVideosList.push(`file '${filePath}'`);
			}

			const concatListLocation = path.resolve(
				presentation.dataLocation,
				'CONCAT_ITEMS.txt'
			);

			fs.writeFileSync(concatListLocation, concatVideosList.join('\n'));

			logs('Concat chunks', 'cyan');
			chunksConcatLocation = path.resolve(
				presentation.dataLocation,
				'CHUNKS_CONCAT.mp4'
			);

			/** @type {T.Command} */
			const ffmpegCommand = {
				command: 'ffmpeg',
				args: [
					'-y',
					'-f',
					'concat',
					'-safe',
					'0',
					'-i',
					concatListLocation,
					'-an',
					'-t',
					presentation.duration,
					'-c',
					config.reEncodeFinalConcat ? 'libx264' : 'copy',
					chunksConcatLocation,
				],
			};

			executeCommand(ffmpegCommand);
		} else {
			// The whole presentation is one sharescreen
			chunksConcatLocation = path.resolve(
				presentation.dataLocation,
				`SCREEN_1.mp4`
			);
			concatVideosList.push(`file '${chunksConcatLocation}'`);
		}

		logs('Combine audio with video', 'magenta');
		const audioLocation = path.resolve(presentation.dataLocation, 'AUDIO.mp3');

		/** @type {T.Command} */
		const combineAudioWithVideo = {
			command: 'ffmpeg',
			args: [
				'-y',
				'-i',
				chunksConcatLocation,
				'-i',
				audioLocation,
				'-c',
				'copy',
				'-t',
				presentation.duration,
				finalFileLocation,
			],
		};

		executeCommand(combineAudioWithVideo);
	}

	/* =========================================================================== */
}

module.exports = VideoCreator;
