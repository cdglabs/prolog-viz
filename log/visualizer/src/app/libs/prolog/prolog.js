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
  var rules = this.rules;
  var goals = this.query;
  var subst = new Subst();
  var trace = new Trace(new Env(goals, rules, subst));

  var resolution = (body, goals, subst) => body.slice().concat(goals.slice(1)).map(term => term.rewrite(subst));

  var solve = env => {
    var elapsedTime = Date.now() - startTime;
    if (elapsedTime > TIME_LIMIT || !env || env.constructor.name !== "Env") {
      return false;
    }

    // Base case: goal list is empty
    if (env.goals.length === 0) {
      // backtrace
      trace.setCurrentEnv(env.parent);
      return env.subst;
    } else {
      trace.setCurrentEnv(env);
      trace.log();

      while (env.children.length < env.rules.length) {
        var goal = env.goals[0];
        var rule = env.rules[env.children.length];
        var subst = env.subst.clone();

        if (hideRulesWithIncompatibleName) {
          if (goal.name !== rule.head.name) {
            env.addChild(new Env(["nothing"], [], undefined));
            continue;
          }
        }

        env.options.currentRuleIndex = env.children.length;

        // Step 1
        env.options.showUnifying = true;
        trace.log();
        delete env.options.showUnifying;

        try {
          subst.unify(goal, rule.head);

          var tempSubst = subst.filter(rule.getQueryVarNames().concat(goal.getQueryVarNames()));

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

          env.options.showSucceeded = true;

          env.options.substituting = tempSubst; // this is defferent for each rule/children
          trace.log();
          delete env.options.substituting;

          env.rules[env.children.length] = newRule;

          var newGoals = resolution(newRule.body, env.goals, subst);
          var newEnv = new Env(newGoals, env.rules, subst, {
            "latestGoals": newGoals.slice(0, newRule.body.length),
            "solution": subst.filter(queryVarNames).toString(),
            "reversedSubst": reversedSubst,
            "ruleBeforeSubstitution": rule.toString(),
            "parentSubst": tempSubst.toString()
            });
          env.addChild(newEnv);

          trace.log();
          delete env.options.showSucceeded;

          delete env.options.currentRuleIndex;

          return solve(newEnv);
        } catch(e) {
          if (e.message !== "unification failed") {
            console.log(e);
          }
          env.addChild(new Env(["nothing"], [], undefined));

          env.options.showFailed = true;
          trace.log();
          delete env.options.showFailed;

          // backtrace
          delete env.options.currentRuleIndex;
          trace.log();
        }
      }

      delete env.options.currentRuleIndex;
      return solve(env.parent);
    }
  };

  return {
    next: function() {
      return solve(trace.currentEnv);
    },
    getTraceIter: trace.getIterator.bind(trace)
  };
};
