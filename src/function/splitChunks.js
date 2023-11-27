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

		const slideImageLocation = path.resolve(
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
			for (let shape of slide.shapes) {
				command = createFFmpegCommand(
					slideImageLocation,
					inputBuilder,
					{
						start: splitStart,
						end: shape.timestamp.start,
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
					});

					fs.writeFileSync(
						path.resolve(
							presentation.dataLocation,
							`${slide.id}_${splitIndex}_cmd.txt`
						),
						command
					);

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

			const lastShapes = slide.shapes.at(-1);

			command = createFFmpegCommand(
				slideImageLocation,
				inputBuilder,
				{
					start: splitStart,
					end: lastShapes.timestamp.start,
				},
				complexFilterFileLocation,
				videoChunkLocation
			);

			commandSplits[slideId].push({
				id: `${slide.id}_${splitIndex}`,
				command,
				index: splitIndex,
				splitStart,
				splitEnd: lastShapes.timestamp.start,
				videoChunkLocation,
			});

			fs.writeFileSync(
				path.resolve(
					presentation.dataLocation,
					`${slide.id}_${splitIndex}_cmd.txt`
				),
				command
			);
		}
	}

	return commandSplits;
}

module.exports = splitChunks;
