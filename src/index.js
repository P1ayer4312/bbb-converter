const PresentationInfo = require('./class/PresentationInfo');

async function main() {
	// console.clear();
	const input =
		'https://bbb-lb.finki.ukim.mk/playback/presentation/2.3/d77cafab172d08527fd8df9f2309c2a2c8938f9d-1640872045817';

	const BBB = new PresentationInfo(input, 'http://localhost:3000');
	await BBB.fetchAllXmlFiles();
	await BBB.loadCourseNameAndTitle();
	console.log(BBB);
}
main();
