/**
 * Slice an array into multiple arrays
 * @param {Array} array
 * @param {number} chunkSize
 * @returns {Array[]}
 */
function sliceArrayToMultiple(array, chunkSize) {
	const arrayCopy = [...array];
	const chunksHolder = [];

	while (arrayCopy.length > 0) {
		chunksHolder.push(arrayCopy.splice(0, chunkSize));
	}

	return chunksHolder;
}

module.exports = sliceArrayToMultiple;
