(() => {
	const pLinks = [];
	document.querySelectorAll('a[data-target="presentation"]').forEach((el) => {
		pLinks.push(new URL(el.getAttribute('data-href')).searchParams.get('href'));
	});

	const a = document.createElement('a');
	const bread = Array.from(document.querySelectorAll('.breadcrumb-item'));
	/** @type {string} */
	const course = bread.at(-3).innerText;
	const coursePrefix = course.substring(0, course.indexOf('-'));
	a.download = `${coursePrefix}-${new Date().getTime()}.txt`;
	const blob = new Blob([pLinks.reverse().join('\n')], { type: 'plain/text' });

	const reader = new FileReader();
	reader.onloadend = () => {
		a.href = reader.result;
		a.click();
	};

	reader.readAsDataURL(blob);
})();
