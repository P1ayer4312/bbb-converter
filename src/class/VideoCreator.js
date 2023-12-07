// eslint-disable-next-line no-unused-vars
const T = require('../types/typedefs');
const logs = require('../function/logs');
const fs = require('node:fs');
const path = require('node:path');
const executeCommand = require('../function/executeCommand');
const config = require('../../config.json');
const splitChunks = require('../function/splitChunks');
const { filterPerTimestamp } = require('../function/ffmpegHelper');

/**
 * Wrapper class for creating videos
 */
class VideoCreator {
	/** @param {T.Resolution} resolution */
	constructor(resolution) {
		logs('Creating "VideoCreator" instance', 'yellow');
		/** @type {T.Chunk[]} */
		this.sequence = [];
		this.resolution = resolution;
		/** @type {T.ChunkSplits | null} */
		this.splitChunks = null;
	}

	/**
	 * Generates complex filter files for ffmpeg
	 * @param {T.DataSorter} dataSorter
	 * @param {T.PresentationInfo} presentation
	 */
	createSequence(dataSorter, presentation) {
		const commandSplits = splitChunks(dataSorter, presentation);
		this.splitChunks = commandSplits;

		for (let slide of dataSorter.slides) {
			/** @type {T.Chunk} */
			const chunk = {};
			// 'offset' is used for correcting chunk timings for elements
			// const offset = slide.timestamp.start;
			let offset = slide.timestamp.start;
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

			const inputBuilder = [presentation.cursorLocation];
			// Center slide if it's smaller than the desired resolution
			const slideDefs =
				`[0]pad=width=${this.resolution.width}:height=${this.resolution.height}:x=-1:y=-1:color=black,setsar=1,` +
				`scale=${this.resolution.width}:${this.resolution.height}:force_original_aspect_ratio=1[v0];[v0]`;

			const slideSplits = commandSplits[slide.id];

			for (let splitCount = 0; splitCount < slideSplits.length; splitCount++) {
				const complexFilterFileName = `${slide.id}_${splitCount}.txt`;
				const complexFilterFileLocation = path.resolve(
					presentation.dataLocation,
					complexFilterFileName
				);

				// if (fs.existsSync(complexFilterFileLocation)) {
				// 	continue;
				// }

				const slideSplit = slideSplits[splitCount];
				let complexFilterBuilder = [];
				// offset = slideSplit.splitStart;

				// Check if there are cursors present
				// We check for the splitCount because we already have
				// the cursor rendered in the first iteration, there's no
				// point to render the cursor again
				if (slide.cursors !== null) {
					const cursors = slide.cursors.filter((el) => {
						return (
							(el.timestamp.start >= slideSplit.splitStart &&
								el.timestamp.end <= slideSplit.splitEnd) ||
							el.timestamp.start >= slideSplit.splitStart
						);
					});

					for (let n = 0; n < cursors.length; n++) {
						const cursor = cursors[n];
						const cursorX = (
							chunk.width * cursor.position.posX +
							padding
						).toFixed(2);
						const cursorY = (chunk.height * cursor.position.posY).toFixed(2);
						const start = (cursor.timestamp.start - offset).toFixed(2);
						const end = (cursor.timestamp.end - offset).toFixed(2);

						complexFilterBuilder.push(
							(n === 0 ? slideDefs : `[v${n}]`) +
								`[1:v]overlay=${cursorX}:${cursorY}:enable='between(t,${start},${end})'` +
								(n < cursors.length - 1 ? `[v${n + 1}];\n` : ``)
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
					// TODO: Remove splitRange if it's not used
					// const shapes = [...slide.shapes].splice(
					// 	slideSplit.splitRange.from,
					// 	slideSplit.splitRange.count
					// );

					// Create copy before patching the timings for each
					// filtered item from "filterPerTimestamp"
					const shapes = [...slide.shapes].filter((item) => {
						return filterPerTimestamp(
							item,
							slideSplit.splitStart,
							slideSplit.splitEnd
						);
					});
					let stop = 1;
					for (let n = 0; n < shapes.length; n++) {
						const shape = shapes[n];
						const offset = shape.timestamp.start;
						const start = (shape.timestamp.start - offset).toFixed(2);
						const end = (shape.timestamp.end - offset).toFixed(2);

						complexFilterBuilder.push(
							(n === 0
								? `[v${lastCursor}];[v${lastCursor}]`
								: `[v${lastCursor + n}]`) +
								`[${n + 2}:v]overlay=0:0:enable=` +
								`'between(t,${start},${end})'` +
								(n < shapes.length - 1 ? `[v${lastCursor + n + 1}];\n` : ``)
						);
						inputBuilder.push(shape.location);
					}
				}

				fs.writeFileSync(
					complexFilterFileLocation,
					`START: ${slideSplit.splitStart} - END: ${slideSplit.splitEnd}\n` +
						complexFilterBuilder.join('')
				);
			}
		}
	}

	/**
	 * Use data from the sequence array to generate slide video chunks
	 */
	renderChunks() {
		for (let imageId of Object.keys(this.splitChunks).slice(0, 1)) {
			// In case the program fails and restarts, check which chunk index is
			// last and skip the previous ones, since there are no longer needed.
			// If the final chunk index is not rendered, ignore this check
			const lastChunk = this.splitChunks[imageId].at(-1);
			const lastChunkIndex = lastChunk
				? Number(lastChunk.id.charAt(lastChunk.id.length - 1))
				: 0;
			const isLastChunkIndexPresent = lastChunk
				? fs.existsSync(lastChunk.videoChunkLocation)
				: false;

			for (let chunk of this.splitChunks[imageId]) {
				const currentChunkIndex = Number(chunk.id.charAt(chunk.id.length));
				if (
					fs.existsSync(chunk.videoChunkLocation) ||
					(isLastChunkIndexPresent && currentChunkIndex < lastChunkIndex)
				) {
					logs(
						`Skipping ${chunk.id}, video chunk exists or is not needed`,
						'red'
					);
					continue;
				}
				logs(`Rendering chunk: ${chunk.id}`, 'cyan');
				executeCommand(chunk.command);
			}
		}

		logs('Chunks rendering complete', 'magenta');
	}

	/**
	 * Combines everything into one large video
	 * @param {T.PresentationInfo} presentation
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
