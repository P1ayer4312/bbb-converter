// eslint-disable-next-line no-unused-vars
const DataSorter = require('./DataSorter');
const fs = require('node:fs');
const path = require('node:path');
/**
 * Wrapper class for creating videos
 */
class VideoCreator {
	/**
	 * @param {{width: Number, height: Number}} resolution
	 */
	constructor(resolution) {
		this.sequence = [];
		this.resolution = resolution;
	}
	/**
	 * Generates complex filter files for ffmpeg
	 * @param {DataSorter} dataSorter
	 * @param {String} dataLocation
	 */
	createSequence(dataSorter, dataLocation) {
		for (let slide of dataSorter.slides) {
			/**
			 * @type {{width: Number, height: Number, cursor: (String|null), shapes: (String|null)}}
			 */
			const chunk = {
				cursor: null,
				shapes: null,
			};
			const offset = slide.timestamp.start;
			chunk.height = this.resolution.height;
			chunk.width = Math.round(
				(this.resolution.height * slide.resolution.width) /
					slide.resolution.height
			);
			// Check if there are cursors present
			if (slide.cursors !== null) {
				const complexFilterBuilder = [];
				for (let n = 0; n < slide.cursors.length; n++) {
					const cursor = slide.cursors[n];
					const cursorX = (chunk.width * cursor.position.posX).toFixed(2);
					const cursorY = (chunk.height * cursor.position.posY).toFixed(2);
					const start = (cursor.timestamp.start - offset).toFixed(1);
					const end = (cursor.timestamp.end - offset).toFixed(1);

					if (n === 0) {
						complexFilterBuilder.push(
							`[0:v][1:v]overlay=${cursorX}:${cursorY}` +
								`:enable='between(t,${start},${end})'[v${n + 1}];`
						);
					} else if (n < slide.cursors.length - 1) {
						complexFilterBuilder.push(
							`[v${n}][1:v]overlay=${cursorX}:${cursorY}` +
								`:enable='between(t,${start},${end})'[v${n + 1}];`
						);
					} else {
						complexFilterBuilder.push(
							`[v${n}][1:v]overlay=${cursorX}:${cursorY}` +
								`:enable='between(t,${start},${end})'`
						);
					}
				}

				chunk.cursor = `${slide.id}_cursor.txt`;
				fs.writeFileSync(
					path.resolve(dataLocation, chunk.cursor),
					complexFilterBuilder.join('')
				);
			}

			// Check if there are shapes present //TODO
		}
	}
}

module.exports = VideoCreator;
