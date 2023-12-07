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
	videoChunkLocation
) {
	const chunkDuration = Number(
		(slideTimestamp.end - slideTimestamp.start).toFixed(2)
	);

	return (
		`ffmpeg -y -loop 1 -r 20 ` +
		`-i "${slideBackgroundContent}" -i "${inputBuilder.join('" -i "')}" ` +
		`-t ${chunkDuration} -filter_complex_script "${complexFilterFileLocation}" ` +
		`-an "${videoChunkLocation}"`
	);
}

/**
 * Filter elements that should appear withing a given time frame
 * @param {T.Shape} element
 * @param {number} start
 * @param {number} end
 * @returns {T.Shape[]}
 */
function filterPerTimestamp(element, start, end) {
	/* == Check order
	- start and end of an element are within the time frame
	- element's start point is within the time frame's start and end window
	- element's end point is within the time frame's start and end window
	- element's start point is less than the time frame's start point, and
		it's end point is greater than the time frame's end point */

	switch (true) {
		case element.timestamp.start >= start && element.timestamp.end <= end:
		case element.timestamp.start >= start && element.timestamp.start <= end:
		case element.timestamp.end >= start && element.timestamp.end <= end:
		case element.timestamp.start < start && element.timestamp.end > end: {
			// Patch the time to not go over the chunk duration
			// if (element.timestamp.start < start) {
			// 	element.timestamp.start = start;
			// }

			// if (element.timestamp.end > end) {
			// 	element.timestamp.end = end;
			// }

			return true;
		}

		default:
			return false;
	}
}

module.exports = {
	createFFmpegCommand,
	filterPerTimestamp,
};
