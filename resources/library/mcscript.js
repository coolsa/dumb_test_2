(function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){
(function (process){

var lib= require('../lib/index.js');
lib.genModals(process.argv[2] || './')

}).call(this,require('_process'))
},{"../lib/index.js":3,"_process":9}],2:[function(require,module,exports){
const fs = require('fs');
const path = require('path')
const basicModals = require('./modals/basic.json')
var modals = []
var genID = 1
var vars = []
var consts = []
modals = modals.concat(basicModals)
generate = function(exp,oldFile) {
  let processed = {}

  let prjPath = oldFile.split("/").indexOf("functions")
  let prjName = "noname"
  if(prjPath > -1){
    prjName = oldFile.split("/")[prjPath - 1]
    prjPath = oldFile.split("/").slice(0,prjPath + 1).join("/").replace(".//","")
  } else {
    prjPath = "."
  }

  let res = js(exp)
  for(let pro in processed){
    res += processed[pro]
  }
  for(let cnst of consts){
    res = res.split('$(' + cnst.name + ')').join(cnst.value);
  }
  return res

  function js(exp) {
    switch (exp.type) {
      case "num"    :
      case "str"    :
      case "comment"   : return comment(exp);
      case "command"   : return exp.value;
      case "stop"   : return '#stop'
      case "continue"   : return '#continue'
      case "modal"   : return js_modal (exp);
      case "bool"   : return js_atom   (exp);
      case "initvar"    : return js_init(exp);
      case "const"    : return js_const(exp);
      case "var"    : return js_var    (exp);
      case "binary" : return js_binary (exp);
      case "assign" : return js_assign (exp);
      case "let"    : return js_let    (exp);
      case "if"     : return make_if(exp);
      case "as"     : return make_indent(exp,"as");
      case "at"     : return make_indent(exp,"at");
      case "align"  : return make_indent(exp,"align");
      case "dimension": return make_indent(exp,"in");
      case "rotated"     : return make_indent(exp,"rotated");
      case "anchored"     : return make_indent(exp,"anchored");
      case "positioned"     : return make_indent(exp,"positioned");
      case "for"   : return gen_for   (exp);
      case "while"   : return gen_while   (exp);
      case "prog"   : return js_prog   (exp);
      case "call"   : return js_call   (exp);
      default:
      throw new Error("Dunno how to generate mcfunction for " +exp.type+" in" + oldFile);
    }
  }
  function comment(exp){
    if(exp.value.trim() == '#'){
      return ''
    }
    if(exp.value.trim() == '##'){
      return '\n'
    }
    return exp.value
  }
  function js_atom(exp) {
    return JSON.stringify(exp.value); // cheating ;-)
  }
  function make_var(name) {
    return name;
  }
  function js_var(exp) {
    return make_var(exp.value);
  }
  function js_binary(exp) {
    let selector = exp.left.selector ? exp.left.selector : exp.left
    let selector2 = exp.right.selector ? exp.right.selector : exp.right
    if(exp.operator == "=") return js_assign(exp)
    else if(exp.operator == "+=" && vars.indexOf(exp.left.value) >= 0 && exp.right.type == "num") return 'scoreboard players add ' + selector.value  + ' ' + exp.left.value + ' ' + exp.right.value
    else if(exp.operator == "-=" && vars.indexOf(exp.left.value) >= 0 && exp.right.type == "num") return 'scoreboard players remove ' + selector.value  + ' ' + exp.left.value + ' ' + exp.right.value

    else if(exp.operator && vars.indexOf(exp.left.value) >= 0 && exp.right.type == "var" && vars.indexOf(exp.right.value) >= 0) return 'scoreboard players operation ' + selector.value  + ' ' + exp.left.value + ' '+exp.operator+' ' + selector2.value + ' ' + exp.right.value
    else throw exp.left.value + " is not declared or you messed something up!\n in: " + oldFile
  }
  // assign nodes are compiled the same as binary
  function js_assign(exp) {
    let selector = exp.left.selector ? exp.left.selector : exp.left
    let selector2 = exp.right.selector ? exp.right.selector : exp.right
    if(vars.indexOf(exp.left.value) >= 0 && exp.right.type == "num") return 'scoreboard players set ' + selector.value  + ' ' + exp.left.value + ' ' + exp.right.value
    else if(vars.indexOf(exp.left.value) >= 0 && exp.right.type == "var" && vars.indexOf(exp.right.value) >= 0) return 'scoreboard players operation ' + selector.value  + ' ' + exp.left.value + ' = ' + selector2.value + ' ' + exp.right.value
    else throw exp.left.value + " is not declared!\n in: " + oldFile
  }
  function js_init(exp){
    if(vars.indexOf(exp.name) < 0){
    vars.push(exp.name)
    let selector = exp.selector ? exp.selector.value : exp.name
    if(processed['mcscript/load']) processed['mcscript/load'] += 'scoreboard objectives add ' + exp.name + ' dummy\n' + 'scoreboard players set ' + selector + ' ' + exp.name + ' 0\n'
    else processed['mcscript/load'] = '#extend: '+ prjPath +'/mcscript/load\n# please do not touch this file!\n# it is used by the compiler!\nscoreboard objectives add ' + exp.name + ' dummy\n'  + 'scoreboard players set ' + selector + ' ' + exp.name + ' 0\n'
    if(exp.assign) return js_assign(exp.assign)
  } else console.error( "\x1b[31m","The varible " + exp.name + " was declared multiple times!","\x1b[0m")
  }
  function js_const(exp){
    if(exp.value && exp.assign != null){
      consts.push({name: exp.value, value: exp.assign})
    }
    return ""
  }
  function js_let(exp) {
    if (exp.vars.length == 0)
    return js(exp.body);
    var iife = {
      type: "call",
      func: {
        type: "lambda",
        vars: [ exp.vars[0].name ],
        body: {
          type: "let",
          vars: exp.vars.slice(1),
          body: exp.body
        }
      },
      args: [ exp.vars[0].def || FALSE ]
    };
    return "(" + js(iife) + ")";
  }
  function make_if(exp){
    let res = make_indent(exp,"if")
    let _else = ""
    if(exp.else){
      exp.then = exp.else
      _else = make_indent(exp,"unless")
    }
    return res + "\n" + _else
  }
  function testforBinary(cond){
    let selector = cond.left.selector ? cond.left.selector : cond.left
    let selector2 = cond.right.selector ? cond.right.selector : cond.right
    if(cond.right.type == "var"){
      return " score " + selector.value+ ' '+ cond.left.value + ' ' + cond.operator.value + ' '+ selector2.value + ' ' + cond.right.value
    } else if(cond.right.type == "num" && cond.operator.value == "=="){
      return " score " + selector.value+ ' '+ cond.left.value + ' matches ' + cond.right.value
    }
    else if(cond.right.type == "num" && cond.operator.value == ">"){
      return " score " + selector.value+ ' '+ cond.left.value + ' matches ' + (cond.right.value + 1) + '..'
    }
    else if(cond.right.type == "num" && cond.operator.value == "<"){
      return " score " + selector.value+ ' '+ cond.left.value + ' matches ..' + (cond.right.value - 1)
    }
    else if(cond.right.type == "num" && cond.operator.value == ">="){
      return " score " + selector.value+ ' '+ cond.left.value + ' matches ' + cond.right.value + '..'
    }
    else if(cond.right.type == "num" && cond.operator.value == "<="){
      return " score " + selector.value+ ' '+ cond.left.value + ' matches ..' + cond.right.value
    }
    else throw "Don´t know what you mean with " + cond.operator.value + '?\n In: ' + oldFile
  }
  function make_indent(exp,name) {
    let commands = []
    let subTree = []
    subTree = subTree.concat(js(exp.then).split("\n"))
    for(let sT of subTree){
      if(sT == "") continue
      let middle = ""
      let nestedMiddle = ""
      for(let cond of exp.cond){
        let nameOp = name
        if(cond.not && name == "if") nameOp = "unless"
        if(cond.not && name == "unless") nameOp = "if"
        if(cond.type == "selector" && (name == "unless" || name == "if")) nameOp += " entity"

        if(exp.nest){
          for(let nested of exp.nest){
            for(let nestedCond of nested.cond){
              let keyWord = nested.type
              if(nestedCond.not && nested.type == "if") keyWord = "unless"
              if(nestedCond.not && nested.type == "unless") keyWord = "if"
              if(nested.type == "dimension") keyWord = "in"
              if(nestedCond.type == "selector" && (nested.type == "if" || nested.type == "unless")) keyWord += " entity"

              if(nestedCond.op && nestedCond.op == "or"){
                commands.push("execute" + " " + nameOp +" " + cond.value + " " + keyWord +" " + nestedCond.value + " run " + sT)
              } else {

                if(nestedCond.value) nestedMiddle += " " + keyWord +" " + nestedCond.value
                else if(cond.type == "binary" && (name == "if" || name == "unless")){
                  nestedMiddle += ' ' + keyWord + testforBinary(cond)
                }
              }
            }
          }
        }
        if(cond.op && cond.op == "or"){
          if(cond.value) commands.push("execute" + " " + nameOp +" " + cond.value + nestedMiddle + " run " + sT)
          else if(cond.type == "binary") commands.push("execute" + " " + nameOp +" " + testforBinary(cond) + nestedMiddle + " run " + sT)
        } else {
          if(cond.value) middle += " " + nameOp +" " + cond.value
          if(cond.type == "binary" && (name == "unless" || name == "if")){
            middle += ' ' + nameOp + testforBinary(cond)
          }
        }
      }
      commands.push("execute" + middle + nestedMiddle + " run " + sT)
    }
    return commands.join("\n")
  }
  function js_prog(exp) {
    return "" + exp.prog.map(js).join("\n") + "";
  }
  function js_call(exp) {
    for(let mod of modals){
      if(mod.func == exp.func.value){
        return gen_modal(mod, exp)
      }
    }
    if(exp.func.value == "for") return gen_for(exp)
    return js(exp.func) + "(" + exp.args.map(js).join(", ") + ")";
  }
  function gen_for(exp){
    if(exp.args[0].type == "num" && exp.args[1].type == "num"){
      let output = []
      let variable = "i"
      if(exp.args[2]){
        variable = exp.args[2].value
      }
      for(let i = exp.args[0].value; i <= exp.args[1].value; i++){
        output.push(js(exp.after).split("$("+variable+")").join(i))
      }
      return output.join("\n")
    } else {
      throw new Error("Check your Loop arguments")
    }
  }
  function gen_while(exp){
    genID++
    retString = "#file: " + prjPath + '/mcscript/while_' + genID + '\n'
    retString += js(exp.then) + '\n'
    retString = retString.split('#stop').join('tag @s add mcscriptStop')
    retString = retString.split('#continue').join("function " + prjName + ':mcscript/while_' + genID)
    let middle = ""
    if(exp.cond.length < 1) throw("You must specify an argument for while! ("+oldFile+")")
    for(let cond of exp.cond){
      let nameOp = "if"
      if(cond.not) nameOp = "unless"
      if(cond.type == "binary"){
        middle += ' ' + nameOp + testforBinary(cond)
      }

      if(cond.op && cond.op == "or"){
        retString += "execute if entity @s[tag=!mcscriptStop]" + " " + nameOp +" " + cond.value + " run function " + prjName + ':mcscript/while_' + genID + '\n'
      } else {
        if(cond.value) middle += " " + nameOp +" " + cond.value
      }
    }
    retString += "execute if entity @s[tag=!mcscriptStop]" + middle + " run function " + prjName + ':mcscript/while_' + genID + '\n'
    retString += 'tag @s[tag=mcscriptStop] remove mcscriptStop'
    processed['while_' + genID] = retString
    return "function " + prjName + ':mcscript/while_' +genID
  }
  function js_modal(exp){
    exp.call.after = js(exp.call.after)
    modals.push(exp.call)
    return
  }
  function gen_modal(modal,exp){
    let after = modal.after
    modal.args.forEach((arg, num) => {
      if(exp.args[num] || arg.type == 'assign') {
        let newVal
        let oldVal
        if(arg.type == 'assign'){
          newVal = exp.args[num] ? exp.args[num].value : arg.right.value
          oldVal = arg.left.value
        } else {
          newVal = exp.args[num].value
          oldVal = arg.value
        }
        after = after.split('$(' + oldVal + ')').join(newVal)
      }
      else throw "At modal call \"" + modal.func + "\" no " + num+ ". argument was found!"
    })
    return after
  }
}

function ensureDirectoryExistence(filePath) {
  var dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

getFiles = function(dir) {
  var results = [];
  var list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    var stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      /* Recurse into a subdirectory */
      results = results.concat(getFiles(file));
    } else {
      /* Is a file */
      if(file.split(".").pop() == "mcscript") results.push(file);
    }
  });
  return results;
}

exports.getFiles = getFiles
exports.getModals = function(ast,oldFile){
  let data = generate(ast)
  let file = oldFile.replace(".mcscript","")
  ensureDirectoryExistence(file)
  fs.writeFile(file + '.json', JSON.stringify(modals), (err) => {
    if (err) throw err;
    console.log("\x1b[36m","Generated Modal file ","\x1b[33m",file + '.json',"\x1b[0m")
  });
}
exports.parseCode = function(ast,oldFile){
  // let stream = InputStream(str)
  // let output = TokenStream(stream)
  // let ast = parse(output)
  // console.log(JSON.stringify(ast))
  let data = generate(ast,oldFile)
  if(oldFile.split("/").splice(-2).join('/') == 'functions/load.mcscript'){
    data = '#file: ./mcscript/load\n' + data
  }
  let savedData = data
  let extendArr = []
  data = data.split("#file: ")
  for(let datChunk of data){
    let extended = datChunk.split("#extend: ")
    if(extended.length > 1){
      extendArr = extended.slice(1)
      data[data.indexOf(datChunk)] = extended[0]
    }
  }
  checkFilename(data,oldFile,function(file,dat){
    dat =  "#######\n# Compiled from "+oldFile.split("/").splice(-4).join('/')+"\n# to "+ file.split("\\").splice(-4).join('/') + ".mcfunction\n#\n# Generated by Minecraft Script for 1.13\n######\n" + dat.join("\n")

    ensureDirectoryExistence(file)
    fs.writeFile(file + '.mcfunction', dat, (err) => {
      if (err) throw err;
      console.log("\x1b[36m","Generated ","\x1b[33m",file + '.mcfunction',"\x1b[0m")
    });
  })

  // extend file
  extendArr.push("")
  checkFilename(extendArr,oldFile,function(file,dat){
    dat =  "\n# Extended from "+oldFile.split("/").splice(-4).join('/')+"\n# to "+ file.split("\\").splice(-4).join('/') + ".mcfunction\n" + dat.join("\n")

    ensureDirectoryExistence(file)
    fs.appendFile(file + '.mcfunction', dat, (err) => {
      if (err) throw err;
      console.log("\x1b[36m","Extended ","\x1b[33m",file + '.mcfunction',"\x1b[0m")
    });
  },true)
}

function checkFilename(data,oldFile,then,ignoreSingle = false){
  if(data.length > 1){
    data.forEach(dat => {
      if(dat != ""){
        dat = dat.split("\n")
        let file = dat[0].trim()
        if(file.substring(0,2) == "./") {
          file = oldFile.substring(0,oldFile.lastIndexOf('/') + 1) + file.substring(2,file.length)
        }
        if(file.substring(0,3) == "../") {
          let uri = oldFile.split("\\")
          uri.splice(uri.length - 1)
          file = uri.join("/") + file.substring(3,file.length)
        }
        dat.shift(0)
        then(file,dat)
      }
    })
  } else {
    let file = oldFile.replace(".mcscript","")
    if(!ignoreSingle) then(file,data)
  }
}
// fs.readFile('./code.mcjs', {encoding: "utf8"}, function(err, data) {
//   parseCode(data)

// let array = []
// let iscurrent = true
// while(iscurrent){
//   let d = output.next()
//   if(d){
//     array.push(d)
//     iscurrent = true
//   } else iscurrent = false
// }
// console.log(array)
// });

},{"./modals/basic.json":5,"fs":7,"path":8}],3:[function(require,module,exports){
const fs = require('fs');

const lexer = require('./lexer.js')
const parser = require('./parser.js')
const gen = require('./generator.js')

const compile = function(path){
  let num = 1
  if(fs.lstatSync(path).isFile()){
    readFile(path)
    console.log("\x1b[32m","Read " + num + " Files and compiled successfully","\x1b[0m")
  } else {
    //console.log(gen.getFiles(path))
    for(file of gen.getFiles(path)){
      console.log(file)
      num++
      readFile(file)
    }
    console.log("\x1b[32m","Read " + num + " Files and compiled successfully","\x1b[0m")
  }
}
const genModals = function(path){
  if(fs.lstatSync(path).isFile()){
    readFile(path, true)
    console.log("\x1b[32m","Read " + path + " and compiled to JSON","\x1b[0m")
  } else throw "Just one File accepted!"
}

const watch = function(path){
  console.log("\x1b[32m","Now I watch your files on "+path+" to change! *-*","\x1b[0m")
  let counter = false
  fs.watch(path, { recursive: true }, (eventType, filename) => {
    filename = filename.replace(/\\/g, "/")
  if (filename && filename.split('.').pop() == 'mcscript' && counter) {
    console.log("\x1b[36m",filename + " changed and got compiled!","\x1b[0m")
    readFile(path + filename)
  }
  counter = !counter
});
}

function readFile(file, noParse){
  fs.readFile(file, {encoding: "utf8"}, function(err, data) {
    //console.dir(parser.parse(lexer.lexer(data)))
    //console.log(JSON.stringify(parser.parse(lexer.lexer(data))))
    data = data.split("\n")
    for(let item of data){
      if(item.trim() == "{"){
        data[data.indexOf(item) - 1] = data[data.indexOf(item) - 1].substr(0, data[data.indexOf(item) - 1].length -2)
      }
      if(",;({[".indexOf(item.trim().slice(-1)) == -1){
        data[data.indexOf(item)] += ";"
      }
    }
    data= data.join("\n")
    if(noParse) gen.getModals(parser.parse(lexer.lexer(data)),file)
    else gen.parseCode(parser.parse(lexer.lexer(data, file)),file)
    //else console.log(JSON.stringify(parser.parse(lexer.lexer(data, file))))
  })
}
exports.compile = compile
exports.watch = watch
exports.genModals = genModals

},{"./generator.js":2,"./lexer.js":4,"./parser.js":6,"fs":7}],4:[function(require,module,exports){
const fs = require('fs');
function InputStream(input, file = '') {
  if(file) file = ' in file ' + file
  var pos = 0, line = 1, col = 0;
  return {
    next  : next,
    peek  : peek,
    peekNext  : peekNext,
    getCol  : getCol,
    eof   : eof,
    croak : croak,
  };
  function next() {
    var ch = input.charAt(pos++);
    if (ch == "\n"){
      if(",;(){[".indexOf(input.charAt(pos--)) == -1){
        input[pos] = ";"
      }
      pos++
      line++
      col = 0
    }
    else col++;
    return ch;
  }
  function peek() {
    return input.charAt(pos);
  }
  function peekNext(num) {
    return input.charAt(pos + num);
  }
  function getCol() {
    let num = col
    let pos2 = pos - 1
    while(" \r\n\t".indexOf(input.charAt(pos2)) >= 0 && num >= 1){
      pos2--
      num--
    }
    return num
  }
  function eof() {
    return peek() == "";
  }
  function croak(msg) {
    throw new Error(msg + " (" + line + ":" + col + ")" + file);
  }
}

function TokenStream(input) {
  var current = null;
  var keywords = " if then else true false for as at positioned modal align dimension rotated anchored while stop continue var score const ";
  return {
    next  : next,
    peek  : peek,
    eof   : eof,
    croak : input.croak
  };
  function is_keyword(x) {
    return keywords.indexOf(" " + x + " ") >= 0;
  }
  function is_digit(ch) {
    return /[0-9]/i.test(ch);
  }
  function is_id_start(ch) {
    return /[a-zÎ»_]/i.test(ch);
  }
  function is_id(ch) {
    return is_id_start(ch) || "?!-<>=0123456789".indexOf(ch) >= 0;
  }
  function is_op_char(ch) {
    return "+-*/%=&|<>!".indexOf(ch) >= 0;
  }
  function is_punc(ch) {
    return ",;(){}[]".indexOf(ch) >= 0;
  }
  function is_whitespace(ch) {
    return " \r\n\t".indexOf(ch) >= 0;
  }
  function read_while(predicate) {
    var str = "";
    while (!input.eof() && predicate(input.peek()))
    str += input.next();
    return str;
  }
  function read_number() {
    var has_dot = false;
    var number = read_while(function(ch){
      if (ch == ".") {
        if (has_dot) return false;
        has_dot = true;
        return true;
      }
      return is_digit(ch);
    });
    return { type: "num", value: parseFloat(number) };
  }
  function read_ident() {
    var id = read_while(is_id);
    return {
      type  : is_keyword(id) ? "kw" : "var",
      value : id
    };
  }
  function read_escaped(end) {
    var escaped = false, str = "";
    input.next();
    while (!input.eof()) {
      var ch = input.next();
      if (escaped) {
        str += ch;
        escaped = false;
      } else if (ch == "\\") {
        escaped = true;
      } else if (ch == end) {
        break;
      } else {
        str += ch;
      }
    }
    return str;
  }
  function read_string() {
    return { type: "str", value: read_escaped('"') };
  }
  function read_string2() {
    return { type: "str", value: read_escaped("'") };
  }
  function skip_comment() {
    read_while(function(ch){ return ch != "\n" });
    input.next();
  }
  function readSelector(){
    let value = input.next() + input.next()
    if(input.peek() == "[") {
      value += read_while(function(ch){ return ch != "]" }) + input.next()
    }
    return { type: "selector", value: value }
  }
  function read_comment() {
    return { type: "comment", value: read_while(function(ch){ return ch != "\n" && ch != ";" }) }
  }
  function read_command() {
    let command = read_while(function(ch){ return ch != "\n" && ch != ";" })
    if(command[0] == "/") command = command.substr(1)
    return { type: "command", value: command.split('run: ').join("")}
  }
  function read_next() {
    read_while(is_whitespace);
    if (input.eof()) return null;
    var ch = input.peek();
    if(ch == "/" && input.peekNext(1) == "/"){
      skip_comment()
      return read_next();
    }
    if(ch == "r" && input.peekNext(1) == "u" && input.peekNext(2) == "n" && input.peekNext(3) == ":") {
      return read_command();
    }
    if(ch == "/" && input.getCol() === 0){
      return read_command();
    }
    if(ch == "$"){
      console.log(input.peekNext(1))
      if(input.peekNext(1) == "("){
        let res = {type: "num", value: read_while(function(ch){ return ch != ")" }) + ")"}
        input.next()
        return res
      }
    }
    if (ch == "#") {
      return read_comment()
    }
    if (ch == "@") return readSelector()
    if (ch == '"') return read_string();
    if (ch == "'") return read_string2();
    if (is_digit(ch)) return read_number();
    if (is_id_start(ch)) return read_ident();
    if (is_punc(ch)) return {
      type  : "punc",
      value : input.next()
    };
    if (is_op_char(ch)) return {
      type  : "op",
      value : read_while(is_op_char)
    };
    input.croak("Can't handle character: " + JSON.stringify(ch));
  }
  function peek() {
    return current || (current = read_next());
  }
  function next() {
    var tok = current;
    current = null;
    return tok || read_next();
  }
  function eof() {
    return peek() == null;
  }
}

exports.lexer = function(str,file = ''){
  // let output = TokenStream(InputStream(str))
  // let array = []
  // let iscurrent = true
  // while(iscurrent){
  //   let d = output.next()
  //   if(d){
  //     array.push(d)
  //     iscurrent = true
  //   } else iscurrent = false
  // }
  // console.log(array)

  return TokenStream(InputStream(str,file))
}

},{"fs":7}],5:[function(require,module,exports){
module.exports=[
  {
    "type": "call",
    "func": "log",
    "args": [
      {
        "type": "var",
        "value": "text"
      },
      {
        "type": "assign",
        "operator": "=",
        "left": {
          "type": "var",
          "value": "sel"
        },
        "right": {
          "type": "str",
          "value": "@a"
        }
      }
    ],
    "after": "tellraw $(sel) [{\"text\":\"console => \",\"color\":\"aqua\"},{\"text\":\"$(text)\",\"color\":\"white\"}]"
  },
  {
    "type": "call",
    "func": "newStand",
    "args": [
      {
        "type": "assign",
        "operator": "=",
        "left": {
          "type": "var",
          "value": "name"
        },
        "right": {
          "type": "str",
          "value": ""
        }
      },
      {
        "type": "assign",
        "operator": "=",
        "left": {
          "type": "var",
          "value": "position"
        },
        "right": {
          "type": "str",
          "value": "~ ~ ~"
        }
      },
      {
        "type": "assign",
        "operator": "=",
        "left": {
          "type": "var",
          "value": "tags"
        },
        "right": {
          "type": "str",
          "value": "[]"
        }
      },
      {
        "type": "assign",
        "operator": "=",
        "left": {
          "type": "var",
          "value": "marker"
        },
        "right": {
          "type": "num",
          "value": 1
        }
      },
      {
        "type": "assign",
        "operator": "=",
        "left": {
          "type": "var",
          "value": "invisible"
        },
        "right": {
          "type": "num",
          "value": 1
        }
      },
      {
        "type": "assign",
        "operator": "=",
        "left": {
          "type": "var",
          "value": "noGravity"
        },
        "right": {
          "type": "num",
          "value": 1
        }
      }
    ],
    "after": "summon armor_stand $(position) {CustomName:\"{\\\"text\\\":\\\"$(name)\\\"}\", Tags: $(tags),Invisible:$(invisible),Marker:$(marker),NoGravity:$(noGravity)}"
  }
]

},{}],6:[function(require,module,exports){
const fs = require('fs');
var FALSE = { type: "str", value: '' };
exports.parse = function(input) {
  var PRECEDENCE = {
    "=": 1,
    "||": 2,
    "&&": 3,
    "<": 7, ">": 7, "<=": 7, ">=": 7, "==": 7, "!=": 7,
    "+": 10, "-": 10, "+=": 10, "-=": 10,
    "*": 20, "/": 20, "%": 20, "*=": 20, "/=": 20, "%=": 20,
  };
  return parse_toplevel();
  function is_punc(ch) {
    var tok = input.peek();
    return tok && tok.type == "punc" && (!ch || tok.value == ch) && tok;
  }
  function is_kw(kw) {
    var tok = input.peek();
    return tok && tok.type == "kw" && (!kw || tok.value == kw) && tok;
  }
  function is_op(op) {
    var tok = input.peek();
    return tok && tok.type == "op" && (!op || tok.value == op) && tok;
  }
  function skip_punc(ch) {
    if (is_punc(ch)) input.next();
    else input.croak("Expecting punctuation: \"" + ch + "\"");
  }
  function skip_kw(kw) {
    if (is_kw(kw)) input.next();
    else input.croak("Expecting keyword: \"" + kw + "\"");
  }
  function skip_op(op) {
    if (is_op(op)) input.next();
    else input.croak("Expecting operator: \"" + op + "\"");
  }
  function unexpected() {
    input.croak("Unexpected token: " + JSON.stringify(input.peek()));
  }
  function maybe_binary(left, my_prec) {
    var tok = is_op();
    if (tok) {
      var his_prec = PRECEDENCE[tok.value];
      if (his_prec > my_prec) {
        input.next();
        return maybe_binary({
          type     : tok.value == "=" ? "assign" : "binary",
          operator : tok.value,
          left     : left,
          right    : maybe_binary(parse_atom(), his_prec)
        }, my_prec);
      }
    }
    return left;
  }
  function delimited(start, stop, separator, parser) {
    var a = [], first = true;
    skip_punc(start);
    while (!input.eof()) {
      if (is_punc(stop)) break;
      if (first) first = false; else skip_punc(separator);
      if (is_punc(stop)) break;
      a.push(parser());
    }
    skip_punc(stop);
    return a;
  }
  function parse_call(func) {
    ret = {
      type: "call",
      func: func,
      args: delimited("(", ")", ",", parse_expression),
    };
    if (is_punc("{")) ret.after = parse_expression();
    return ret
  }
  function parse_varname() {
    var name = input.next();
    if (name.type != "var") input.croak("Expecting variable name");
    return name.value;
  }
  function parse_if() {
    skip_kw("if");
    input.next()
    var cond = parse_key_args()
    input.next()
    if (!is_punc("{")) skip_kw("then");
    var then = parse_expression();
    var ret = {
      type: "if",
      cond: cond,
      then: then,
    };
    if (is_kw("else")) {
      input.next();
      ret.else = parse_expression();
    }
    return ret;
  }
  function parse_while() {
    skip_kw("while");
    input.next()
    var cond = parse_key_args()
    input.next()
    if (!is_punc("{")) skip_kw("then");
    var then = parse_expression();
    var ret = {
      type: "while",
      cond: cond,
      then: then,
    };
    return ret;
  }
  function parse_key_args(){
    let cond = []
    let before = {type: 'op', value: "&&"}
    while(input.peek().value != ")"){
      let next = input.next()
      if(next.value == "!"){
        before = next
        continue
      }
      if(next.type == "selector"){
        if(before.type == "binary") before.right.selector = next
        else if(before.type == "var") before.selector = next
        else cond.push(next)
        continue
      }
      if("> < >= <= == != ".indexOf(next.value + " ") > -1){
        cond.splice(cond.indexOf(before),1)
        next = {type: 'binary', left: before, operator: next, right: input.next()}
        if(before.op){
            next.op = before.op
            delete next.left.op
        }
        cond.push(next)
      }
      if(before.value == "&&"){
        cond.push(next)
      }
      if(before.value == "||" || before.value == ","){
        next.op = "or"
        cond.push(next)
      }
      if(before.value == "!"){
        next.not = true
        cond.push(next)
      }
      before = next
    }
    return cond
  }
  function parse_keyword(kw) {
    skip_kw(kw);
    input.next()
    var cond = parse_key_args()
    input.next()

    let next = input.peek()
    if(next.value == "{"){}
    else if(next.value == ",") {
      input.next()
      let nest = parse_keyword(input.peek().value)
      let res = {
        type: kw,
        nest: [],
        cond: cond,
        then: nest.then,
      }
      res.nest.push({type: nest.type, cond: nest.cond})
      if(nest.nest) res.nest = res.nest.concat(nest.nest)
      return res
    }
    else skip_kw("then");
    //else skip_kw("then");
    var then = parse_expression();
    var ret = {
      type: kw,
      cond: cond,
      then: then,
    };
    return ret;
  }
  function parse_for() {
    skip_kw("for");
    let args = delimited("(", ")", ",", parse_expression)
    let then = parse_expression();
    var ret = {
      type: "for",
      args: args,
      after: then
    };
    return ret;
  }
  function parse_var(kw){
    skip_kw(kw)
    let name = input.next().value
    let res = {type:"initvar",name:name}
    if(input.peek().type == "selector") res.selector = input.next()
    let assign = maybe_binary({type:"var",value:name, selector: res.selector},0)
    if(assign.type == "assign") res.assign = assign
    return res
  }
  function parse_const(){
    skip_kw('const')
    let name = input.next().value
    input.next()
    let assign = input.next()
    if(assign.type != "num" && assign.type != "str") input.croak("You have to assign a string or number to a constant!")
    return {
      type: "const",
      value: name,
      assign: assign.value
    }
  }
  function parse_modal() {
    skip_kw("modal");
    return {type: "modal", call: parse_call(input.next().value)};
  }
  function parse_lambda() {
    return {
      type: "lambda",
      vars: delimited("(", ")", ",", parse_varname),
      body: parse_expression()
    };
  }
  function parse_bool() {
    return {
      type  : "bool",
      value : input.next().value == "true"
    };
  }
  function returnKey(keyword){
    skip_kw(keyword)
    return {type: keyword}
  }
  function maybe_call(expr) {
    expr = expr();
    return is_punc("(") ? parse_call(expr) : expr;
  }
  function parse_atom() {
    return maybe_call(function(){
      if (is_punc("(")) {
        input.next();
        var exp = parse_expression();
        skip_punc(")");
        return exp;
      }
      if (is_punc("{")) return parse_prog();
      if (is_kw("if")) return parse_if();
      if(is_kw("const")) return parse_const()
      if (is_kw("var")|| is_kw("score")) return parse_var(input.peek().value);
      if (is_kw("as") || is_kw("at") || is_kw("positioned") || is_kw("align") || is_kw("rotated") || is_kw("anchored") || is_kw("dimension")) return parse_keyword(input.peek().value);
      if (is_kw("for")) return parse_for();
      if (is_kw("stop")) return returnKey('stop')
      if (is_kw("continue")) return returnKey('continue')
      //if (is_kw("selector")) return returnKey('selector')
      if (is_kw("while")) return parse_while();
      if (is_kw("modal")) return parse_modal();
      if (is_kw("true") || is_kw("false")) return parse_bool();
      if (is_kw("lambda") || is_kw("λ")) {
        input.next();
        return parse_lambda();
      }
      var tok = input.next();
      if(tok.type == "comment" || tok.type == "command"){
        return tok
      }
      if(tok.type == "var"){
        if(input.peek().type == "selector"){
          tok.selector = input.next()
        }
        return tok
      }
      if (tok.type == "num" || tok.type == "str") return tok
      unexpected();
    });
  }
  function parse_toplevel() {
    var prog = [];
    while (!input.eof()) {
      prog.push(parse_expression());
      if (!input.eof()) skip_punc(";");
    }
    return { type: "prog", prog: prog };
  }
  function parse_prog() {
    var prog = delimited("{", "}", ";", parse_expression);
    if (prog.length == 0) return FALSE;
    if (prog.length == 1) return prog[0];
    return { type: "prog", prog: prog };
  }
  function parse_expression() {
    return maybe_call(function(){
      return maybe_binary(parse_atom(), 0);
    });
  }
}

},{"fs":7}],7:[function(require,module,exports){

},{}],8:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":9}],9:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[1]);
