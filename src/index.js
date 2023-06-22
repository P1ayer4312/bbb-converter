const PresentationInfo = require('./class/PresentationInfo');
const DataSorter = require('./class/DataSorter');
const VideoCreator = require('./class/VideoCreator');

async function main() {
	console.clear();

	const input =
		// 'https://bbb-lb.finki.ukim.mk/playback/presentation/2.3/7d5c455433cfd1280a0d9fad409dfb696eecb6e5-1672051620472'; // idk
		// 'https://bbb-lb.finki.ukim.mk/playback/presentation/2.3/7d5c455433cfd1280a0d9fad409dfb696eecb6e5-1672138257960'; // bakeva 27min
	// 'https://bbb-lb.finki.ukim.mk/playback/presentation/2.3/bff113a5794c1228cadcf02954dcd7bf4d01dd04-1634137180022?meetingId=bff113a5794c1228cadcf02954dcd7bf4d01dd04-1634137180022';
	'https://bbb-lb.finki.ukim.mk/playback/presentation/2.3/255619411653edc094ed7403785e154d3204b47b-1652871045488'; // with polls
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

	DATA_SORTER.cleanUp(BBB, input);
}
main();
