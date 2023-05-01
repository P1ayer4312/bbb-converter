const PresentationInfo = require('./class/PresentationInfo');
const DataSorter = require('./class/DataSorter');
const VideoCreator = require('./class/VideoCreator');

async function main() {
	console.clear();

	const input =
		'https://bbb-lb.finki.ukim.mk/playback/presentation/2.3/7d5c455433cfd1280a0d9fad409dfb696eecb6e5-1672138257960';

	const videoResolution = { width: 1920, height: 1080 };
	const BBB = new PresentationInfo(input); //, 'http://localhost:3000'
	BBB.createFolders();
	await BBB.fetchAllXmlFiles();
	BBB.loadCourseNameAndTitle();

	const DATA_SORTER = new DataSorter();
	DATA_SORTER.mapSlidesInfo(BBB);
	DATA_SORTER.groupCursorsByTime(BBB);
	await DATA_SORTER.downloadSlides(BBB.dataLocation);
	await DATA_SORTER.downloadSharescreen(BBB);
	await DATA_SORTER.downloadAudio(BBB);
	await DATA_SORTER.exportShapesToPng(BBB, videoResolution);
	const VIDEO_CREATOR = new VideoCreator(videoResolution);
	VIDEO_CREATOR.createSequence(DATA_SORTER, BBB);
	VIDEO_CREATOR.renderChunks();

}
main();
