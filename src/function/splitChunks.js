// eslint-disable-next-line no-unused-vars
const T = require('../types/typedefs');
const path = require('node:path');
const { createFFmpegCommand } = require('./ffmpegHelper');
const MAX_COMMAND_LENGTH = 7500; // Left breathing room ~600 chars
const fs = require('node:fs');

/**
 * @param {T.DataSorter} dataSorter
 * @param {T.PresentationInfo} presentation
 * @returns {T.ChunkSplits}
 */
function splitChunks(dataSorter, presentation) {
	/** @type {T.ChunkSplits} */
	const commandSplits = {};

	for (let slide of dataSorter.slides) {
		let splitIndex = 0;
		let splitStart = 0;
		let inputBuilder = [presentation.cursorLocation];
		let command = '';
		const slideId = slide.id;
		commandSplits[slideId] = [];

		let slideBackgroundContentLocation = path.resolve(
			presentation.dataLocation,
			slide.fileName
		);

		let videoChunkLocation = path.resolve(
			presentation.dataLocation,
			`${slide.id}_${splitIndex}.mp4`
		);

		let complexFilterFileLocation = path.resolve(
			presentation.dataLocation,
			`${slide.id}_${splitIndex}.txt`
		);

		if (slide.shapes !== null) {
			let splitRangeFrom = 0;
			for (let n = 0; n < slide.shapes.length; n++) {
				const shape = slide.shapes[n];

				command = createFFmpegCommand(
					slideBackgroundContentLocation,
					inputBuilder,
					{
						start: slide.timestamp.start,
						end: slide.timestamp.end,
					},
					complexFilterFileLocation,
					videoChunkLocation
				);

				if (command.length >= MAX_COMMAND_LENGTH) {
					commandSplits[slideId].push({
						id: `${slide.id}_${splitIndex}`,
						command,
						index: splitIndex,
						splitStart,
						splitEnd: shape.timestamp.start,
						videoChunkLocation,
						splitRange: {
							from: splitRangeFrom,
							count: n - splitRangeFrom,
						},
					});

					const presentationCmdLocation = path.resolve(
						presentation.dataLocation,
						`${slide.id}_${splitIndex}_cmd.txt`
					);

					// if (!fs.existsSync(presentationCmdLocation)) {
					fs.writeFileSync(presentationCmdLocation, command);
					// }

					splitRangeFrom = n;
					splitIndex += 1;
					splitStart = shape.timestamp.start;
					inputBuilder = [presentation.cursorLocation];

					videoChunkLocation = path.resolve(
						presentation.dataLocation,
						`${slide.id}_${splitIndex}.mp4`
					);

					complexFilterFileLocation = path.resolve(
						presentation.dataLocation,
						`${slide.id}_${splitIndex}.txt`
					);
				}

				inputBuilder.push(shape.location);
			}

			if (inputBuilder.length > 1) {
				const lastShapes = slide.shapes.at(-1);

				command = createFFmpegCommand(
					slideBackgroundContentLocation,
					inputBuilder,
					{
						start: slide.timestamp.start,
						end: slide.timestamp.end,
					},
					complexFilterFileLocation,
					videoChunkLocation
				);

				const lastCmdSplit = commandSplits[slideId].at(-1);
				commandSplits[slideId].push({
					id: `${slide.id}_${splitIndex}`,
					command,
					index: splitIndex,
					splitStart,
					splitEnd: lastShapes.timestamp.end,
					videoChunkLocation,
					splitRange: {
						from: lastCmdSplit
							? lastCmdSplit.splitRange.from + lastCmdSplit.splitRange.count
							: 0,
						count: inputBuilder.length - 1,
					},
				});

				const presentationCmdLocation = path.resolve(
					presentation.dataLocation,
					`${slide.id}_${splitIndex}_cmd.txt`
				);

				// if (!fs.existsSync(presentationCmdLocation)) {
				fs.writeFileSync(presentationCmdLocation, command);
				// }
			}
		}
	}

	return commandSplits;
}

module.exports = splitChunks;
