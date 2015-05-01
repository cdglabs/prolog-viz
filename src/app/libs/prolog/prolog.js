var ohm = require('../ohm.min.js');
var assign = require('object-assign');

var {Program, Rule, Clause, Var, Subst} = require('./AST.js');
var Env = require('./Env.js');
var Trace = require('./Trace.js');

var Prolog = function(grammar) {
  // The parser
  var g = grammar;//ohm.grammar("L");
  var toAST = g.synthesizedAttribute({
    Program:         function(rules, query)        { return new Program(toAST(rules), toAST(query)); },
    Rule_body:       function(head, _, body, _)    { return new Rule(toAST(head), toAST(body), this.interval); },
    Rule_noBody:     function(head, _)             { return new Rule(toAST(head), undefined, this.interval); },
    Query:           function(c, _)                { return toAST(c); },
    Clause_args:     function(sym, _, a, _, as, _) { return new Clause(toAST(sym), [toAST(a)].concat(toAST(as))); },
    Clause_noArgs:   function(sym)                 { return new Clause(toAST(sym)); },
    Clauses:         function(c, _, cs)            { return [toAST(c)].concat(toAST(cs)); },
    List_empty:      function(_, _)                { return new Clause('_nil'); },
    List_nonEmpty:   function(_, xs, _)            { return toAST(xs); },
    Contents_cons1:  function(x, _, xs)            { return new Clause('_cons', [toAST(x), toAST(xs)]); },
    Contents_cons2:  function(x, _, xs)            { return new Clause('_cons', [toAST(x), toAST(xs)]); },
    Contents_single: function(x)                   { return new Clause('_cons', [toAST(x), new Clause('_nil')]); },
    variable:        function(_, _)                { return new Var(this.interval.contents); },
    symbol:          function(_, _)                { return this.interval.contents; },
    _terminal: ohm.actions.getValue,
    _list: ohm.actions.map,
    _default: ohm.actions.passThrough
  });

  var L = new Interpreter(g, "Program", toAST);
  // L.evalAST is declared in plumbing.js
  // L.prettyPrintAST and L.prettyPrintValue are declared in prettyPrint.js

  // You will have to implement `Program.prototype.solve()`, which should return an
  // iterator of substitutions. The implementation of the `evalAST` method below calls
  // `Program.prototype.solve()`, and filters out the bindings that don't have
  // anything to do with the query. It also wraps the iterator in order to
  // support a `rewind` method that is used by the test harness.

  L.evalAST = function(progAST) {
    var iter = progAST.solve();
    if (!iter || !iter.next) {
      throw new Error("expected iterator but got " + JSON.stringify(iter));
    }
    var noMoreSolutions = false;
    var solns = [];
    var idx = 0;
    return {
      next: function() {
        var soln;
        if (!noMoreSolutions) {
          soln = iter.next();
          if (soln) {
            solns.push(soln);
          } else {
            noMoreSolutions = true;
          }
        }
        if (idx < solns.length) {
          soln = solns[idx++];
        }
        return soln ?
          soln.filter(progAST.getQueryVarNames()) :
          false;
      },
      rewind: function() {
        idx = 0;
      }
    };
  };

  L.prettyPrintValue = function(iter) {
    if (!iter || !iter.next) {
      throw new Error("expected iterator but got " + JSON.stringify(iter));
    }
    var output = [];
    var N = 5;
    var soln;
    for (var idx = 0; idx < N; idx++) {
      soln = iter.next();
      if (idx > 0) {
        output.push("\n");
      }
      if (!soln) {
        output.push("** no more answers **");
        break;
      } else if (!(soln instanceof Subst)) {
        throw new Error("expected substitution but got " + JSON.stringify(soln));
      } else {
        output.push(soln.toString());
      }
    }
    if (soln) {
      output.push("\n...");
    }
    return output.join("");
  };

  L.solve = function (text, showOnlyCompatible) {
    var program = this.parse(text);
    var TIME_LIMIT = 150;
    var iter = program.solve(showOnlyCompatible, TIME_LIMIT, Env, Trace);
    var startTime = Date.now();
    while (iter.next() && Date.now() - startTime < TIME_LIMIT);
    return iter.getTraceIter();
  };

  return L;
};

module.exports = Prolog;

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

function Interpreter(grammar, startRule, toAST) {
  this.grammar = grammar;
  this.startRule = startRule;
  this.toAST = toAST;
}
Interpreter.prototype = Object.create(JS);
Interpreter.prototype.evalAST = function(ast) {
  throw new Error("subclass responsibility");
};
Interpreter.prototype.parse = function(code) {
  var cst = this.grammar.matchContents(code, this.startRule, true);
  return this.toAST(cst);
};
Interpreter.prototype.eval = function(code) {
  var ast = this.parse(code);
  return this.evalAST(ast);
};
// TODO: Think about providing a better pretty-printer by default, since I know
// that parse trees will be arrays (though maybe it's better to keep things general).
Interpreter.prototype.prettyPrintAST = Interpreter.prototype.stringify;
