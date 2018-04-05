define([
	'codemirror',
	'crafty',
	'jquery',
	'filetree',
	'compiler',
	'jqueryresizable',
	'codemirror/mode/javascript/javascript',
	'codemirror/addon/scroll/simplescrollbars'
],function(CodeMirror, Crafty, $, filetree, compiler){
	function interface(){
		//this.$render-area = $(".main-code");
		if(localStorage.text==undefined)localStorage.text="";
		this.isoSize=0;
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
		this.slider();
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
		slider: function(){
			var that = this;
			$(".text-render")[0].style.maxWidth = $(".main-code").width()-$(".splitter").width() +"px";
			$(".text-render").resizable({
				handleSelector: ".splitter",
				resizeHeight:false,
				onDrag: function(){
					that.resizeIso();
				},
				onDragEnd: function(){
					that.resizeIso();
					that.editor.refresh();
				}
			});
			$(window).resize(function(){
				$(".text-render")[0].style.maxWidth = $(".main-code").width()-$(".splitter").width() +"px";
				$(".center")[0].style.maxHeight = $(window).height()-100 + "px";
				that.resizeIso();
				that.editor.refresh();
			});
			this.resizeIso();
		},
		resizeIso: function(){
				$('.cube-render').width($(".main-code").width()-$(".text-render").width()-$(".splitter").width());
				Crafty.viewport.width=$(".main-code").width()-$(".text-render").width()-$(".splitter").width();
				Crafty.viewport.height=$(".main-code").height();
				Crafty.viewport.reload();
				Crafty.viewport.x = ($(".main-code").width()-$(".text-render").width())/2-8*this.isoSize;
				Crafty.viewport.y = $(".main-code").height()/2;
		},
		jumpTo: function(line){
			var t = this.editor.charCoords({line: line, ch: 0}, "local").top;
			var middleHeight = this.editor.getScrollerElement().offsetHeight / 2;
			this.editor.scrollTo(null, t - middleHeight - 5);
			this.editor.setSelection({line:line,ch:0},{line:line+1,ch:0})
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
