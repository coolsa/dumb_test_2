define([
	'codemirror',
	'jquery',
	'filetree',
	'compiler',
	'jqueryresizable',
	'codemirror/mode/javascript/javascript',
	'codemirror/addon/scroll/simplescrollbars'
],function(CodeMirror, $, filetree, compiler){
	function interface(){
		//this.$render-area = $(".main-code");
		if(localStorage.text==undefined)localStorage.text="";
		this.editor = CodeMirror($(".code-replace")[0],{
			mode: 'javascript',
			lineNumbers: true,
			value: localStorage.text,
			theme: 'pastel-on-dark',
			scrollbarStyle: 'simple'
		});
		this.editor.setSize('100%','100%');
		var editor = this.editor;
		this.editor.on("change",function(){localStorage.text = editor.getValue()})
		this.buttons();
		this.compiler = new compiler($(".compiled-commands"),this.editor);
	}
	interface.prototype = {
		buttons: function(){
			var that = this;
		  document.getElementById("compile").onclick = function() {
				window.run.interface.compiler.fancy();
			};
			document.getElementById("turn-cw").onclick = function() {
				window.run.grid = window.run.iso.rotateCW(window.run.grid);
				window.run.iso.render(window.run.grid);
				window.run.interface.resizeIso();
			};
			document.getElementById("turn-ccw").onclick = function() {
				window.run.grid = window.run.iso.rotateCCW(window.run.grid);
				window.run.iso.render(window.run.grid);
				window.run.interface.resizeIso();
			};
			document.getElementById("undo").onclick = function() {
				window.run.interface.editor.execCommand("undo");
			};
			document.getElementById("redo").onclick = function() {
				window.run.interface.editor.execCommand("redo");
			};
			$(".compiled-commands")[0].onclick = function() {
				that.selectCompiled();
			};
		},
		selectCompiled: function(){
			var selection = window.getSelection();
			var range = document.createRange();
			range.selectNodeContents($(".compiled-commands")[0]);
			selection.removeAllRanges();
			selection.addRange(range);
		}
	}
	return interface;
});
