requirejs.config({
	baseUrl: './script',
	paths: {
		mcscript: '../resources/library/mcscript',
		crafty: '../resources/library/crafty',
		jquery: '../resources/library/jquery',
		jqueryresizable: '../resources/library/jquery-resizable',
		domReady: '../resources/library/domReady'
	},
	packages: [{
		name:'codemirror',
		location: '../resources/library/codemirror',
		main: 'lib/codemirror'
	}]
});
require([
	'running',
	'domReady',
	'interface',
	'filetree',
	'mcscript',
	'compiler',
	'jquery',
	'jqueryresizable',
	'codemirror',
	'codemirror/mode/htmlmixed/htmlmixed'
	],
function (running, domReady){
	domReady(function(){
		window.run = new running();
	});
});
