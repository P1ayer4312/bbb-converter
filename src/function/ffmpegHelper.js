// Set of functions for generating FFmpeg inputs
const T = require('../types/typedefs');

/**
 * Create command that will be passed to FFmpeg to create a video
 * with the provided inputs
 * @param {string} slideImageLocation
 * @param {string[]} inputBuilder
 * @param {T.Timestamp} slideTimestamp
 * @param {string} complexFilterFileLocation
 * @param {string} videoChunkLocation
 * @returns
 */
function createFFmpegCommand(
	slideImageLocation,
	inputBuilder,
	slideTimestamp,
	complexFilterFileLocation,
	videoChunkLocation
) {
	const chunkDuration = Number(
		(slideTimestamp.end - slideTimestamp.start).toFixed(2)
	);

	return (
		`ffmpeg -y -loop 1 -r 20 -i "${slideImageLocation}" ` +
		`-i "${inputBuilder.join('" -i "')}" -t ${chunkDuration} ` +
		`-filter_complex_script "${complexFilterFileLocation}" ` +
		`"${videoChunkLocation}"`
	);
}

module.exports = {
	createFFmpegCommand,
};
