var ohm = require('../ohm.min.js');
var assign = require('object-assign');

var AST = require('./AST.js');
var Program = AST.Program;
var Rule = AST.Rule;
var Clause = AST.Clause;
var Var = AST.Var;
var Subst = AST.Subst;

var Env = require('./Env.js');
var Trace = require('./Trace.js');

var Prolog = function(grammar) {
  // The parser
  var g = grammar;//ohm.grammar("L");
  var toAST = g.synthesizedAttribute({
    Program:       function(rules, query)        { return new Program(toAST(rules), toAST(query)); },
    Rule_body:     function(head, _, body, _)    { return new Rule(toAST(head), toAST(body), this.interval); },
    Rule_noBody:   function(head, _)             { return new Rule(toAST(head), undefined, this.interval); },
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


var count = 0;
Program.prototype.solve = function(hideRulesWithIncompatibleName) {
  console.log("=== solve#"+count+" ===");
  count++;
  var TIME_LIMIT = 500; // ms
  var startTime = Date.now();

  var queryVarNames = this.getQueryVarNames();
  var trace = new Trace(new Env(this.query, this.rules, new Subst()));

  var resolution = (body, goals, subst) => body.slice().concat(goals.slice(1)).map(term => term.rewrite(subst));

  var solve = env => {
    if (Date.now() - startTime > TIME_LIMIT || !env || env.constructor.name !== "Env") {
      trace.logLastFrame();
      return false;
    } else if (env.hasSolution()) {
      if (env.parent) {
        env.parent.setCurRuleIndex(-1);
      }
      trace.setCurrentEnv(env.parent);
      return env.subst;
    } else if (env.isEmpty()) {
      env.parent.setCurRuleIndex(-1);
      return solve(env.parent);
    } else if (env.children.length >= env.rules.length) {
      if (env.parent) {
        env.parent.setCurRuleIndex(-1);
      }
      trace.setCurrentEnv(env);
      trace.log();
      return solve(env.parent);
    } else {
      var goal = env.goals[0];
      var rule = env.rules[env.children.length];
      var subst = env.subst.clone();

      if (hideRulesWithIncompatibleName) {
        if (goal.name !== rule.head.name) {
          env.addChild(new Env());
          return solve(env);
        }
      }

      trace.setCurrentEnv(env);
      trace.log();

      env.setCurRuleIndex(env.children.length);

      // Step 1
      trace.log("1");

      var newEnv;
      try {
        subst.unify(goal, rule.head);

        // Step 2.1
        rule.substituting = subst.filter(rule.getQueryVarNames().concat(goal.getQueryVarNames()));

        // dedup equivalent vars in goals from rules
        var reversedSubst = {};
        goal.getQueryVarNames().forEach(varName => {
          var value = subst.lookup(varName);
          if (value.constructor.name === "Var") {
            reversedSubst[value.name] = varName;
            subst.unbind(varName);
          }
        });
        var dedupedRule = rule.makeCopy({ subst: reversedSubst });
        // rewrite the rule and removed vars from subst
        var newRule = dedupedRule.rewrite(subst);
        var varNamesInNewRule = newRule.getQueryVarNames();
        dedupedRule.getQueryVarNames()
          .filter(varName => varNamesInNewRule.indexOf(varName) < 0)
          .forEach(varName => {
            if (queryVarNames.indexOf(varName) < 0) {
              subst.unbind(varName);
            }
          });
        rule.rewritten = newRule;

        var newGoals = resolution(newRule.body, env.goals, subst);
        newEnv = new Env(newGoals, env.rules, subst, { // TODO
          "numLatestGoals": newRule.body.length,
          "solution": subst.filter(queryVarNames), // this could be parital solution
          });
        env.addChild(newEnv);

        // Step 2.1
        trace.log("2.1");
        // Step 3
        trace.log("3");
      } catch(e) {
        if (e.message !== "unification failed") {
          throw e;
        }
        rule.rewritten = null;

        newEnv = new Env();
        env.addChild(newEnv);

        // Step 2.2
        trace.log("2.2");
      }
      return solve(newEnv);
    }
  };

  return {
    next: function() {
      return solve(trace.currentEnv);
    },
    getTraceIter: trace.getIterator.bind(trace)
  };
};
