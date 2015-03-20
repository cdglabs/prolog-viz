var JS = {};
JS.stringify =
JS.prettyPrintValue = function(x) {
  if (x === undefined) {
    return "undefined";
  } else if (typeof x === "function") {
    return "(" + x.toString() + ")";
  } else if (typeof x === "number") {
    return "" + x;
  } else {
    return JSON.stringify(x);
  }
};
JS.eval = eval;

function Interpreter(grammar, startRule) {
  this.grammar = grammar;
  this.startRule = startRule;
}
Interpreter.prototype = Object.create(JS);
Interpreter.prototype.evalAST = function(ast) {
  throw new Error("subclass responsibility");
};
Interpreter.prototype.parse = function(code) {
  var cst = this.grammar.matchContents(code, this.startRule, true);
  return toAST(cst);
};
Interpreter.prototype.eval = function(code) {
  var ast = this.parse(code);
  return this.evalAST(ast);
};
// TODO: Think about providing a better pretty-printer by default, since I know 
// that parse trees will be arrays (though maybe it's better to keep things general).
Interpreter.prototype.prettyPrintAST = Interpreter.prototype.stringify;

function Translator(grammar, startRule) {
  this.grammar = grammar;
  this.startRule = startRule;
}
Translator.prototype = Object.create(Interpreter.prototype);
Translator.prototype.transAST = function(ast) {
  throw new Error("subclass responsibility");
};
Translator.prototype.evalAST = function(ast) {
  var translation = this.transAST(ast);
  return JS.eval(translation);
};

