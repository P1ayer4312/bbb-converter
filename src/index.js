const PresentationInfo = require('./class/PresentationInfo');
const DataSorter = require('./class/DataSorter');
const VideoCreator = require('./class/VideoCreator');
const Helper = require('./class/Helper');

async function main() {
	const inputsFiles = await Helper.readUrlFiles();
	Helper.setScriptStartTime();
	Helper.clearConsole();

	for (let fileNameKey of Object.keys(inputsFiles)) {
		for (let input of inputsFiles[fileNameKey]) {
			const BBB = new PresentationInfo(input, fileNameKey);
			BBB.createFolders();
			await BBB.fetchAllXmlFiles();
			BBB.loadCourseInfo();

			if (Helper.isPresentationAlreadyExported(BBB)) {
				continue;
			}

			const DATA_SORTER = new DataSorter();
			DATA_SORTER.mapSlidesInfo(BBB);
			DATA_SORTER.groupCursorsByTime(BBB);
			await Promise.allSettled([
				DATA_SORTER.downloadAudioWorker(BBB),
				DATA_SORTER.downloadSharescreenWorker(BBB, Helper.defaultResolution),
				DATA_SORTER.downloadSlidesWorker(
					BBB.dataLocation,
					Helper.defaultResolution
				),
				DATA_SORTER.exportShapesToPngProcess(BBB, Helper.defaultResolution),
			]);

			const VIDEO_CREATOR = new VideoCreator(Helper.defaultResolution);
			VIDEO_CREATOR.createSequence(DATA_SORTER, BBB);
			VIDEO_CREATOR.renderChunks();
			VIDEO_CREATOR.finalRender(BBB);

			DATA_SORTER.createInfoFile(BBB, input);
			DATA_SORTER.cleanUp(BBB);
		}
	}

	Helper.printScriptElapsedTime();
}

main();
