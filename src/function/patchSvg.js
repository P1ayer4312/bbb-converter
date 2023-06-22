const fetchSvgToBase64 = require('./fetchSvgToBase64');

/**
 * Remove elements that prevent the svg from rendering
 * @param {Object} svg
 * @param {PresentationInfo} presentation
 */
async function patchSvg(svg, presentation) {
	svg.style = svg.style.replace('visibility:hidden', '');

	if (svg.shape?.includes('poll')) {
		// Patch the url of polls' svgs, fetch the svg and convert it to base64,
		// because the library that converts svgs to png can't fetch it
		const url = `${presentation.filesUrl}/${svg.image['xlink:href']}`;
		svg.image.href = await fetchSvgToBase64(url);
		delete svg.image['xlink:href'];
	}

	if (svg.switch) {
		// TODO: This needs to be further tested
		// Convert text object into something that svg2img can understand

		/** @type {Array.<String>} */
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
