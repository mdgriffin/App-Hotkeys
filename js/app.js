// adds to array while returning the array
Array.prototype.prepend = function () {
	this.unshift.call(this, Array.prototype.slice.call(arguments));
	return this;
};

Array.prototype.append = function () {
	this.push.call(this, Array.prototype.slice.call(arguments));
	return this;
};

(function () {

	m.request({method: "GET", url: "data/directory.json"}).then(function (directory) {

		var app = {};

		// the loaded json data of a single app
		app.appData;

		app.loadAppData = function (system, version) {

			var baseAppDataUrl;
			var self = this;

			if (self.app['systems'][system]['versions']) {
				var appVersions = Object.keys(self.app.systems[system]['versions']);
				version = version || appVersions[0];
				
				baseAppDataUrl = self.app['systems'][system]['versions'][version];
				self.hasVersions = true;
			} else {
				baseAppDataUrl = self.app['systems'][system];
				self.hasVersions = false;
			}

			m.request({method: "GET", url: baseAppDataUrl}).then(function (data) {
				self.appData = app.appData = data;
				self.currentSystem = system;
				
				self.appVersions = appVersions || self.appVersions
				self.currentVersion = version || self.currentVersion;

				self.appContexts = Object.keys(data);
				self.appContexts.unshift('all');
			});

		};

		app.controller = function () {
			
			var self = this;

			self.app = directory.filter(function (app) {
				if (app.name == m.route.param('appName')) {
					return app;
				}
			})[0] || directory[0];

			self.appSystems = Object.keys(self.app.systems);
			app.loadAppData.call(self, self.appSystems[0]);
			self.currentContext = 'all';

			self.filterInput = m.prop('');

			self.onSystemChange = function (e) {
				app.loadAppData.call(self, this.value);
				// clear filter input
				self.filterInput('');
			};

			self.onVersionChange = function (e) {
				app.loadAppData.call(self, self.currentSystem, this.value);
				// clear filter input
				self.filterInput('');
			};

			self.onContextChange = function (e) {

				self.currentContext = this.value;

				// filter visible bindings based context
				if (this.value === 'all') {
					// show all contexts
					self.appData = app.appData;
				} else {
					// only show a specific context
					var contextData = {};
					contextData[this.value] = app.appData[this.value];
					self.appData = contextData;
				}

				// clear filter input
				self.filterInput('');

			};

			self.onFilterChange = function (inputVal) {

				self.filterInput(inputVal);
				var re = new RegExp(self.filterInput(), 'ig');
				var matches = {};
				var matchFrom;

				if (self.currentContext === 'all') {
					matchFrom = app.appData;
				} else {
					matchFrom = {};
					matchFrom[self.currentContext] = app.appData[self.currentContext];
				}

				Object.keys(matchFrom).forEach(function (context) {

					Object.keys(matchFrom[context]).forEach(function (binding) {

						if (re.test(binding)) {
							if (!matches[context]) matches[context] = {};
							matches[context][binding] = matchFrom[context][binding];
						}

					});

				});

				self.appData = matches;

			};
		
		};

		app.view = function (ctrl) {
			return [
				m('div', {className: 'container clearfix'}, [
					m('div', {className: 'sidebar'}, [
						m('ul', directory.map(function (app) {
							return m('li', [
								m("a[href='/" + app.name + "']", {config: m.route, className: app.name === ctrl.app.name ? 'active':''}, app.displayName)
							]);
						}))
					]),
					m('div', {className: 'app'}, [
						
						m('div', {className: 'app-select'}, [
							m('h1', ctrl.app.displayName),
							m('fieldset', [
								m('label', 'Operating System'),
								m('select', {onchange: ctrl.onSystemChange}, ctrl.appSystems.map(function (system) {
									return m('option', {value: system}, system);
								}))
							]),
							m('fieldset', (function () {
								if (ctrl.hasVersions) {
									return [
										m('label', 'Version'),
										m('select', {onchange: ctrl.onVersionChange}, ctrl.appVersions.map(function (version, index) {
											return m('option', {value: version, key: ctrl.currentSystem + '_version' + index}, version);
										}))
									];
								}
							})()),
							m('fieldset', [
								m('label', 'Context'),
								m('select', {onchange: ctrl.onContextChange}, ctrl.appContexts.map(function (version, index) {
									return m('option', {value: version, key: ctrl.currentSystem + '_' + ctrl.currentVersion + '_context' + index}, version);
								}))
							]),
							m('input', {type: 'text', placeholder: 'Filter Shortcuts',/*onkeyup: ctrl.onFilterChange */onkeyup: m.withAttr("value", ctrl.onFilterChange.bind(ctrl)), value: ctrl.filterInput()})
						]),
						m('div', {className: 'app-bindings'}, (function () {

							var contexts = Object.keys(ctrl.appData);

							if (contexts.length > 0) {
								return contexts.map(function (context) {
									return [
										m('h3', context),
										m('ul', [
											Object.keys(ctrl.appData[context]).map(function (binding) {
												return m('li', {className: 'clearfix'}, ctrl.appData[context][binding].map(function (shortcut) {
													return m('span', {className: 'bindingShortcut'}, shortcut);
												}).prepend(m('span', {className: 'bindingName'}, binding)));
											})
										])
									];
								});
							} else {
								return m('h2', 'No Shortcuts Found');
							}

						})())
					])
				])
			];
		};

		m.route.mode = "hash";

		m.route(document.getElementById("hotkeyApp"), "/", {
			"/": app,
			"/:appName": app
		});

	});

})();