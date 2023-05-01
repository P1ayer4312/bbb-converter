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
			const offset = slide.timestamp.start;
			chunk.height = this.resolution.height;
			chunk.width = Math.round(
				(this.resolution.height * slide.resolution.width) /
				slide.resolution.height
			); //TODO: Mozhe i da ne treba ova // Ne znam brat, treba da vidam
			chunk.timestamp = slide.timestamp;
			// Check if there are cursors present
			const complexFilterBuilder = [];
			const inputBuilder = [
				presentation.cursorLocation
			];
			if (slide.cursors !== null) {
				for (let n = 0; n < slide.cursors.length; n++) {
					const cursor = slide.cursors[n];
					const cursorX = (chunk.width * cursor.position.posX).toFixed(2);
					const cursorY = (chunk.height * cursor.position.posY).toFixed(2);
					const start = (cursor.timestamp.start - offset).toFixed(1);
					const end = (cursor.timestamp.end - offset).toFixed(1);

					complexFilterBuilder.push(
						(n === 0 ? `[0:v]` : `[v${n}]`) +
						`[1:v]overlay=${cursorX}:${cursorY}:enable='between(t,${start},${end})'` +
						(n < slide.cursors.length - 1 ? `[v${n + 1}];` : ``)
					);
				}
			} else {
				// Push empty cursor to not break the chain of inputs
				complexFilterBuilder.push(
					`[0:v][1:v]overlay=-20:-20:enable='between(t,0,0)'`
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
						`[${n + 2}:v]overlay=0:0:enable='between(t,${start},${end})'` +
						(n < slide.shapes.length - 1 ? `[v${lastCursor + n + 1}];` : ``)
					);
					inputBuilder.push(shape.location);
				}
			}

			const complexFilterFileName = `${slide.id}.txt`;
			const complexFilterFileLocation = path.resolve(presentation.dataLocation, complexFilterFileName);
			const slideImageLocation = path.resolve(presentation.dataLocation, slide.fileName);
			chunk.id = slide.id;
			chunk.duration = Number((slide.timestamp.end - slide.timestamp.start).toFixed(1));
			chunk.command =
				`ffmpeg -hide_banner -y -loop 1 -i ${slideImageLocation} -i ${inputBuilder.join(' -i ')} ` +
				`-t ${chunk.duration} -filter_complex_script ${complexFilterFileLocation} ` +
				`${path.resolve(presentation.dataLocation, `${slide.id}.mp4`)}`;

			fs.writeFileSync(complexFilterFileLocation, complexFilterBuilder.join(''));

			this.sequence.push(chunk);
		}
	}
	/**
	 * Use data from the sequence array to generate slide video chunks
	 */
	renderChunks() {
		for (let chunk of this.sequence) {
			logs(`Rendering chunk: ${chunk.id}`);
			execSync(chunk.command, { stdio: config.consoleLogStatus ? 'inherit' : 'ignore' });
		}
	}
}

module.exports = VideoCreator;
