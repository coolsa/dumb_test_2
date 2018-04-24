define(['mcscript'],function(mcscript){
  function compiler(compiled,editor){
    console.log(mcscript);
    this.compiled = compiled;
    this.editor = editor;
    this.output = "";
    this.grid = [[[]]];
    this.compiled.text(this.output);
  }
  compiler.prototype = {

    compile: function(){
      this.compiled.text(this.mcscript.parse(mcscript.TokenStream(mcscript.InputStream(window.run.interface.editor.getValue()))));
    }
  }
  return compiler;
});
