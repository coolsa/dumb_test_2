define([
	'interface',
	'codemirror',
	'codemirror/mode/htmlmixed/htmlmixed'],function(interface, isoGrid, CodeMirror, compiler){
	function running(){
		var largestZ = 0;
		$(".center")[0].style.maxHeight = $(window).height()-100 + "px";
		this.interface = new interface();
	}
	return running;
})
