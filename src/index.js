const PresentationInfo = require('./class/PresentationInfo');
const DataSorter = require('./class/DataSorter');
const VideoCreator = require('./class/VideoCreator');

async function main() {
	console.clear();

	const input =
		'https://bbb-lb.finki.ukim.mk/playback/presentation/2.3/5e08975ff07fc081d979f50c104694f0ad3a688a-1602142107072?meetingId=5e08975ff07fc081d979f50c104694f0ad3a688a-1602142107072';

	const videoResolution = { width: 1920, height: 1080 };
	const BBB = new PresentationInfo(input);
	BBB.createFolders();
	await BBB.fetchAllXmlFiles();
	BBB.loadCourseInfo();

	const DATA_SORTER = new DataSorter();
	DATA_SORTER.mapSlidesInfo(BBB);
	DATA_SORTER.groupCursorsByTime(BBB);
	// await Promise.allSettled([
	// 	DATA_SORTER.downloadAudioWorker(BBB),
	// 	DATA_SORTER.downloadSharescreenWorker(BBB, videoResolution),
	// 	DATA_SORTER.downloadSlidesWorker(BBB.dataLocation, videoResolution),
	// 	// DATA_SORTER.exportShapesToPngWorker(BBB, videoResolution),
	// 	DATA_SORTER.exportShapesToPngProcess(BBB, videoResolution),
	// ]);

	const VIDEO_CREATOR = new VideoCreator(videoResolution);
	VIDEO_CREATOR.createSequence(DATA_SORTER, BBB);
	// VIDEO_CREATOR.renderChunks();
	// VIDEO_CREATOR.finalRender(BBB);

	// DATA_SORTER.createInfoFile(BBB, input);
	DATA_SORTER.cleanUp(BBB);

	console.log('shit"s done');
}

main();
