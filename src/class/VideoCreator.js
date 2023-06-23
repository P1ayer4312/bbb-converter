// eslint-disable-next-line no-unused-vars
const DataSorter = require('./DataSorter');
// eslint-disable-next-line no-unused-vars
const PresentationInfo = require('./PresentationInfo');
// eslint-disable-next-line no-unused-vars
const typedefs = require('../types/typedefs');
const logs = require('../function/logs');
const fs = require('node:fs');
const path = require('node:path');
const executeCommand = require('../function/executeCommand');
const config = require('../../config.json');

/**
 * Wrapper class for creating videos
 */
class VideoCreator {
	/** @param {typedefs.Resolution} resolution */
	constructor(resolution) {
		logs('Creating "VideoCreator" instance', 'yellow');
		/**
		 * @type {Array.<typedefs.Chunk>}
		 */
		this.sequence = [];
		this.resolution = resolution;
	}
	/**
	 * Generates complex filter files for ffmpeg
	 * @param {DataSorter} dataSorter
	 * @param {PresentationInfo} presentation
	 */
	createSequence(dataSorter, presentation) {
		for (let slide of dataSorter.slides) {
			/**
			 * @type {typedefs.Chunk}
			 */
			const chunk = {};
			// 'offset' is used for correcting chunk timings for elements
			const offset = slide.timestamp.start;
			chunk.height = this.resolution.height;
			chunk.width = Math.round(
				(this.resolution.height * slide.resolution.width) /
					slide.resolution.height
			);
			chunk.timestamp = slide.timestamp;
			// Add padding from the left side of cursors / shapes if the
			// slide image width is too small for the wanted resolution
			const padding =
				chunk.width < this.resolution.width
					? (this.resolution.width - chunk.width) / 2
					: 0;
			const complexFilterBuilder = [];
			const inputBuilder = [presentation.cursorLocation];
			// Center slide if it's smaller than the desired resolution
			const slideDefs =
				`[0]pad=width=${this.resolution.width}:height=${this.resolution.height}:x=-1:y=-1:color=black,setsar=1,` +
				`scale=${this.resolution.width}:${this.resolution.height}:force_original_aspect_ratio=1[v0];[v0]`;

			// Check if there are cursors present
			if (slide.cursors !== null) {
				for (let n = 0; n < slide.cursors.length; n++) {
					const cursor = slide.cursors[n];
					// Since we resized the slide size above, we'll have to fix
					// the cursor offsets to work with the new slide resolution
					const newPosX =
						(chunk.width * cursor.position.posX) / slide.resolution.width;
					//* Not sure about this one, looks better without it from my tests
					// const newPosY =
					// 	(chunk.height * cursor.position.posY) / slide.resolution.height;
					const cursorX = (chunk.width * newPosX + padding).toFixed(2);
					const cursorY = (chunk.height * cursor.position.posY).toFixed(2);
					const start = (cursor.timestamp.start - offset).toFixed(2);
					const end = (cursor.timestamp.end - offset).toFixed(2);

					complexFilterBuilder.push(
						(n === 0 ? slideDefs : `[v${n}]`) +
							`[1:v]overlay=${cursorX}:${cursorY}:enable='between(t,${start},${end})'` +
							(n < slide.cursors.length - 1 ? `[v${n + 1}];` : ``)
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
				const lastCursor = complexFilterBuilder.length;
				for (let n = 0; n < slide.shapes.length; n++) {
					const shape = slide.shapes[n];
					const start = (shape.timestamp.start - offset).toFixed(2);
					const end = (shape.timestamp.end - offset).toFixed(2);

					complexFilterBuilder.push(
						(n === 0
							? `[v${lastCursor}];[v${lastCursor}]`
							: `[v${lastCursor + n}]`) +
							`[${n + 2}:v]overlay=0:0:enable=` +
							`'between(t,${start},${end})'` +
							(n < slide.shapes.length - 1 ? `[v${lastCursor + n + 1}];` : ``)
					);
					inputBuilder.push(shape.location);
				}
			}

			const complexFilterFileName = `${slide.id}.txt`;
			const complexFilterFileLocation = path.resolve(
				presentation.dataLocation,
				complexFilterFileName
			);
			const slideImageLocation = path.resolve(
				presentation.dataLocation,
				slide.fileName
			);
			const videoChunkLocation = path.resolve(
				presentation.dataLocation,
				`${slide.id}.mp4`
			);
			chunk.id = slide.id;
			chunk.duration = Number(
				(slide.timestamp.end - slide.timestamp.start).toFixed(2)
			);
			chunk.fileLocation = videoChunkLocation;
			chunk.command =
				`ffmpeg -y -loop 1 -r 20 -i ${slideImageLocation} ` +
				`-i ${inputBuilder.join(' -i ')} -t ${chunk.duration} ` +
				`-filter_complex_script ${complexFilterFileLocation} ` +
				`${videoChunkLocation}`;

			fs.writeFileSync(
				complexFilterFileLocation,
				complexFilterBuilder.join('')
			);
			this.sequence.push(chunk);
		}
	}
	/**
	 * Use data from the sequence array to generate slide video chunks
	 */
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
	/**
	 * Combines everything into one large video
	 * @param {PresentationInfo} presentation
	 */
	finalRender(presentation) {
		// Extract timestamps for each slide / sharescreen from shapes.svg
		logs('Creating chunks concat list', 'cyan');
		let shareScreenCounter = 1;
		const slides = presentation.xmlFiles.slidesXml.svg.image;
		const concatVideosList = [];

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
		const chunksConcatLocation = path.resolve(
			presentation.dataLocation,
			'CHUNKS_CONCAT.mp4'
		);
		const ffmpegCommand =
			`ffmpeg -y -f concat -safe 0 -i ${concatListLocation} ` +
			`-an -c ${config.reEncodeFinalConcat ? 'libx264' : 'copy'} ` +
			chunksConcatLocation;

		executeCommand(ffmpegCommand);

		logs('Combine audio with video', 'cyan');
		const audioLocation = path.resolve(presentation.dataLocation, 'AUDIO.mp3');
		const finalFileLocation = path.resolve(
			presentation.folderLocation,
			`${presentation.outputFileName}.mp4`
		);
		const combineAudioWithVideo =
			`ffmpeg -y -i ${chunksConcatLocation} -i ${audioLocation} ` +
			`-c copy "${finalFileLocation}"`;

		executeCommand(combineAudioWithVideo);
	}
}

module.exports = VideoCreator;
