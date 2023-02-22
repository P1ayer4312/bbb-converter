const PresentationInfo = require('./class/PresentationInfo');
const DataSorter = require('./class/DataSorter');
const VideoCreator = require('./class/VideoCreator');
const { execSync, exec } = require('node:child_process');

async function main() {
	// console.clear();
	const input =
		'https://bbb-lb.finki.ukim.mk/playback/presentation/2.3/0681a482f54429a90397bcded15cc4fcf38aba45-1645195561918';

	const BBB = new PresentationInfo(input, 'http://localhost:3000'); //, 'http://localhost:3000'
  BBB.createFolders();
	await BBB.fetchAllXmlFiles();
	BBB.loadCourseNameAndTitle();

  const DATA_SORTER = new DataSorter();
  DATA_SORTER.mapSlidesInfo(BBB);
	DATA_SORTER.groupCursorsByTime(BBB);

	const VIDEO_CREATOR = new VideoCreator({width: 1920, height: 1080});
	VIDEO_CREATOR.createSequence(DATA_SORTER, BBB.dataLocation);

	// require('node:fs').writeFileSync('full_test.json', JSON.stringify(DATA_SORTER));
  // await DATA_SORTER.exportShapesToPng(BBB);


}
main();
