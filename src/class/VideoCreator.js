// eslint-disable-next-line no-unused-vars
const DataSorter = require('./DataSorter');
// eslint-disable-next-line no-unused-vars
const PresentationInfo = require('./PresentationInfo');
// eslint-disable-next-line no-unused-vars
const typedefs = require('../types/typedefs');
const logs = require('../function/logs');
const config = require('../../config.json');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

/**
 * Wrapper class for creating videos
 */
class VideoCreator {
	/**
	 * @param {typedefs.Resolution} resolution
	 */
	constructor(resolution) {
		logs('Creating "VideoCreator" instance');
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
			// Add padding from the left side of cursors / shapes if the
			// slide image is too small for the wanted resolution
			const padding = slide.resolution.width < this.resolution.width ?
				(this.resolution.width - slide.resolution.width) / 2 : 0;

			chunk.height = this.resolution.height;
			chunk.width = Math.round(
				(this.resolution.height * slide.resolution.width) /
				slide.resolution.height
			);
			chunk.timestamp = slide.timestamp;
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
					const cursorX = ((chunk.width * cursor.position.posX) + padding).toFixed(2);
					const cursorY = (chunk.height * cursor.position.posY).toFixed(2);
					const start = (cursor.timestamp.start - offset).toFixed(1);
					const end = (cursor.timestamp.end - offset).toFixed(1);

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
					const start = (shape.timestamp.start - offset).toFixed(1);
					const end = (shape.timestamp.end - offset).toFixed(1);

					complexFilterBuilder.push(
						(n === 0 ? `[v${lastCursor}];[v${lastCursor}]` : `[v${lastCursor + n}]`) +
						`[${n + 2}:v]overlay=${padding}:0:enable='between(t,${start},${end})'` +
						(n < slide.shapes.length - 1 ? `[v${lastCursor + n + 1}];` : ``)
					);
					inputBuilder.push(shape.location);
				}
			}

			const complexFilterFileName = `${slide.id}.txt`;
			const complexFilterFileLocation = path.resolve(presentation.dataLocation, complexFilterFileName);
			const slideImageLocation = path.resolve(presentation.dataLocation, slide.fileName);
			const videoChunkLocation = path.resolve(presentation.dataLocation, `${slide.id}.mp4`);
			chunk.id = slide.id;
			chunk.duration = Number((slide.timestamp.end - slide.timestamp.start).toFixed(1));
			chunk.fileLocation = videoChunkLocation;
			chunk.command =
				`ffmpeg -hide_banner -y -loop 1 -i ${slideImageLocation} -i ${inputBuilder.join(' -i ')} ` +
				`-t ${chunk.duration} -filter_complex_script ${complexFilterFileLocation} ` +
				`${videoChunkLocation}`;

			fs.writeFileSync(complexFilterFileLocation, complexFilterBuilder.join(''));
			this.sequence.push(chunk);
		}
	}
	/**
	 * Use data from the sequence array to generate slide video chunks
	 */
	renderChunks() {
		for (let chunk of this.sequence) {
			if (fs.existsSync(chunk.fileLocation)) {
				logs(`Skipping ${chunk.id}, video chunk exists`);
				continue;
			}
			logs(`Rendering chunk: ${chunk.id}`);
			execSync(chunk.command, {
				stdio: config.consoleLogStatus ? 'inherit' : 'ignore',
			});
		}
	}
	/**
	 * Combines everything into one large video
	 * @param {PresentationInfo} presentation
	 */
	finalRender(presentation) {
		// Extract timestamps for each slide / sharescreen from shapes.svg
		const chunksTimestamps = [];
		let shareScreenCounter = 1;
		const slides = presentation.xmlFiles.slidesXml.svg.image;

		for (let slide of slides) {
			let filePath;
			if (slide['xlink:href'] == 'presentation/deskshare.png') {
				filePath = path.resolve(presentation.dataLocation, `SCREEN_${shareScreenCounter}.mp4`);
				shareScreenCounter += 1;
			} else {
				filePath = path.resolve(presentation.dataLocation, `${slide.id}.mp4`);
			}

			chunksTimestamps.push({
				start: slide.in,
				end: slide.out,
				filePath,
			});
		}
	}
}

module.exports = VideoCreator;
