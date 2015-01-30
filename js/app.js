(function () {

	m.request({method: "GET", url: "/data/directory.json"}).then(function (directory) {

		var app = {};

		app.controller =  function () {};

		app.view = function (ctrl) {
			return m('h1', 'Hello World ' + m.route.param('appName'));
		};

		m.route.mode = "hash";

		m.route(document.getElementById("hotkeyApp"), "/", {
			"/": app,
			"/:appName": app
		});

	});

})();