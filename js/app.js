var app = {};

app.controller =  function () {};

app.view = function (ctrl) {
	return m('h1', 'Hello World');
};

m.module(document.getElementById('hotkeyApp'), app);