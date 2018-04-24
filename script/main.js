requirejs.config({
	baseUrl: './script',
	paths: {
		crafty: '../resources/library/crafty',
		jquery: '../resources/library/jquery',
		jqueryresizable: '../resources/library/jquery-resizable',
		mcscript: '../resources/library/mcscript',
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
	'mcscript',
	'interface',
	'filetree',
	'compiler',
	'jquery',
	'jqueryresizable',
	'codemirror',
	'codemirror/mode/htmlmixed/htmlmixed'
	],
function (running, domReady, mcscript){
	console.log(mcscript);
	domReady(function(){
		window.run = new running();
	});
});
