const PresentationInfo = require('./class/PresentationInfo');
const DataSorter = require('./class/DataSorter');
const VideoCreator = require('./class/VideoCreator');

async function main() {
	console.clear();

	const input = 'BBB_URL_HERE';

	const videoResolution = { width: 1920, height: 1080 };
	const BBB = new PresentationInfo(input); //, 'http://localhost:3000'
	BBB.createFolders();
	await BBB.fetchAllXmlFiles();
	BBB.loadCourseInfo();

	const DATA_SORTER = new DataSorter();
	DATA_SORTER.mapSlidesInfo(BBB);
	DATA_SORTER.groupCursorsByTime(BBB);
	await Promise.allSettled([
		DATA_SORTER.downloadAudioWorker(BBB),
		DATA_SORTER.downloadSharescreenWorker(BBB, videoResolution),
		DATA_SORTER.downloadSlidesWorker(BBB.dataLocation, videoResolution),
		DATA_SORTER.exportShapesToPngWorker(BBB, videoResolution),
	]);

	const VIDEO_CREATOR = new VideoCreator(videoResolution);
	VIDEO_CREATOR.createSequence(DATA_SORTER, BBB);
	VIDEO_CREATOR.renderChunks();
	VIDEO_CREATOR.finalRender(BBB);

	DATA_SORTER.createInfoFile(BBB, input);
	DATA_SORTER.cleanUp(BBB);
}

main();
