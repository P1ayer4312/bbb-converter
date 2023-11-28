// Set of functions for generating FFmpeg inputs
// eslint-disable-next-line no-unused-vars
const T = require('../types/typedefs');

/**
 * Create command that will be passed to FFmpeg to create a video
 * with the provided inputs
 * @param {string} slideBackgroundContent
 * @param {string[]} inputBuilder
 * @param {T.Timestamp} slideTimestamp
 * @param {string} complexFilterFileLocation
 * @param {string} videoChunkLocation
 * @param {boolean} isFirstInputImage
 * @returns {string}
 */
function createFFmpegCommand(
	slideBackgroundContent,
	inputBuilder,
	slideTimestamp,
	complexFilterFileLocation,
	videoChunkLocation,
	isFirstInputImage = true
) {
	const chunkDuration = Number(
		(slideTimestamp.end - slideTimestamp.start).toFixed(2)
	);

	return (
		`ffmpeg -y ${isFirstInputImage ? '-loop 1 -r 20 ' : ''}` +
		`-i "${slideBackgroundContent}" -i "${inputBuilder.join('" -i "')}" ` +
		`-t ${chunkDuration} -filter_complex_script "${complexFilterFileLocation}" ` +
		`-an "${videoChunkLocation}"`
	);
}

module.exports = {
	createFFmpegCommand,
};
