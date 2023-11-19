// const fetchSvgToBase64 = require('./fetchSvgToBase64');

/**
 * Remove elements that prevent the svg from rendering
 * @param {object} svg
 * @param {import("../class/PresentationInfo")} presentation
 */
async function patchSvg(svg, presentation) {
	svg.style = svg.style.replace('visibility:hidden', '');

	if (svg.shape?.includes('poll')) {
		// Patch the url location from where the poll is being fetched
		// Since polls are not downloaded with the dummy data, we need
		// to use the original url to fetch the poll
		const url = presentation.isLocalDevEnv
			? presentation.originalFilesUrl
			: presentation.filesUrl;

		svg.image.href = `${url}/${svg.image['xlink:href']}`;
	}

	if (svg.switch) {
		// TODO: This needs to be further tested
		// Convert text object into something that svg2img can understand

		/** @type {string[]} */
		const style = Array.from(new Set(svg.style.split(';')));
		const getStyleValue = (keyName) => {
			return style.find((el) => el.includes(keyName))?.split(':')[1] || null;
		};

		// Extract color
		const color = getStyleValue('color') || 'red';

		// Patch y offset by adding the font size to the y position
		const fontSize = Number(getStyleValue('font-size')?.replace('px', '')) || 0;
		const yPos = (Number(svg.switch.foreignObject.y) + fontSize).toString();

		// Fix font color
		style.push(`fill:${color}`);

		const text = {
			x: svg.switch.foreignObject.x,
			y: yPos,
			style: style.join(';'),
			textValue: svg.switch.foreignObject.p['#text'],
		};

		delete svg.switch.foreignObject.p['#text'];
		svg.text = text;
	}
}

module.exports = patchSvg;
