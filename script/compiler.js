define([],function(){
  function compiler(compiled,editor){
    this.compiled = compiled;
    this.editor = editor;
    this.output = "";
    this.grid = [[[]]];
    this.compiled.text(this.output);
  }
  compiler.prototype = {
    
    fancy: function(){
      this.compiled.text(window.run.interface.editor.getValue());
    },
    setGrid: function(){
      window.run.grid = this.grid;
    }
  }
  return compiler;
});
