(() => {
	const pLinks = [];
	document.querySelectorAll('a[data-target="presentation"]').forEach((el) => {
		pLinks.push(new URL(el.getAttribute('data-href')).searchParams.get('href'));
	});

	const a = document.createElement('a');
	const bread = Array.from(document.querySelectorAll('.breadcrumb-item'));
	a.download = `${bread.at(-3).innerText}-${bread.at(-1).innerText}.txt`;
	const blob = new Blob([pLinks.reverse().join('\n')], { type: 'plain/text' });

	const reader = new FileReader();
	reader.readAsDataURL(blob);
	reader.onloadend = () => {
		a.href = reader.result;
		a.click();
	};
})();
