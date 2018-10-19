var initMap = function(){
	jQuery('#google-map').gMap({
		address: 'Melbourne, Australia',
		maptype: 'ROADMAP',
		zoom: 14,
		markers: [
			{
				address: "Melbourne, Australia",
				html: '<div style="width: 300px;"><h4 style="margin-bottom: 8px;">Hi, we\'re <span>Envato</span></h4><p class="nobottommargin">Our mission is to help people to <strong>earn</strong> and to <strong>learn</strong> online. We operate <strong>marketplaces</strong> where hundreds of thousands of people buy and sell digital goods every day, and a network of educational blogs where millions learn <strong>creative skills</strong>.</p></div>',
				icon: {
					image: "images/icons/map-icon-red.png",
					iconsize: [32, 39],
					iconanchor: [32,39]
				}
			},
			{
				address: "Melbourne, Australia",
				html: '<div style="width: 300px;"><h4 style="margin-bottom: 8px;">Hi, we\'re <span>Envato</span></h4><p class="nobottommargin">Our mission is to help people to <strong>earn</strong> and to <strong>learn</strong> online. We operate <strong>marketplaces</strong> where hundreds of thousands of people buy and sell digital goods every day, and a network of educational blogs where millions learn <strong>creative skills</strong>.</p></div>',
				icon: {
					image: "images/icons/map-icon-red.png",
					iconsize: [32, 39],
					iconanchor: [32,39]
				}
			}
		],
		doubleclickzoom: false,
		controls: {
			panControl: true,
			zoomControl: true,
			mapTypeControl: true,
			scaleControl: false,
			streetViewControl: false,
			overviewMapControl: false
		}
	});
};