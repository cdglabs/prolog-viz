// The parser

var g = ohm.grammar("L");
var toAST = g.synthesizedAttribute({
  Program:       function(rules, query)        { return new Program(toAST(rules), toAST(query)); },
  Rule_body:     function(head, _, body, _)    { return new Rule(toAST(head), toAST(body)); },
  Rule_noBody:   function(head, _)             { return new Rule(toAST(head)); },
  Query:         function(c, _)                { return toAST(c); },
  Clause_args:   function(sym, _, a, _, as, _) { return new Clause(toAST(sym), [toAST(a)].concat(toAST(as))); },
  Clause_noArgs: function(sym)                 { return new Clause(toAST(sym)); },
  Clauses:       function(c, _, cs)            { return [toAST(c)].concat(toAST(cs)); },
  variable:      function(_, _)                { return new Var(this.interval.contents); },
  symbol:        function(_, _)                { return this.interval.contents; },
  _terminal: ohm.actions.getValue,
  _list: ohm.actions.map,
  _default: ohm.actions.passThrough
});

var L = new Interpreter(g, "Program", toAST);

// L.evalAST is declared in plumbing.js
// L.prettyPrintAST and L.prettyPrintValue are declared in prettyPrint.js

