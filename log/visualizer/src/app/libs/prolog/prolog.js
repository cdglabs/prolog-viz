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
Program.prototype.solve = function(showOnlyCompatible) {
  console.log("=== solve#"+count+" ===");
  count++;

  var rules = this.rules;
  var goals = this.query;
  var subst = new Subst();
  var trace = new Trace(new Env(goals, rules, subst));

  // skip duplicated solutions
  var solutions = [];

  var resolution = (body, goals, subst) => body.slice().concat(goals.slice(1)).map(term => term.rewrite(subst));

  var TIME_LIMIT = 500; // ms
  var startTime = Date.now();
  var solve = env => {

    var elapsedTime = Date.now() - startTime;
    if (elapsedTime > TIME_LIMIT) {
      return false;
    }

    if (!env || env.constructor.name !== "Env") {
      return false;
    }

    trace.currentEnv = env;

    var goals = env.goals;
    var rules = env.rules;
    if (goals.length === 0) {
      var solution = env.subst.filter(this.getQueryVarNames()).toString();
      env.solution = solution;

      if (env.parent) {
        trace.currentEnv = env.parent;
        trace.record();
      }

      if (solutions.indexOf(solution) < 0) {
        solutions.push(solution);
        return env.subst;
      }
    } else {
      while (env.children.length < rules.length) {
        var goal = goals[0];
        var rule = rules[env.children.length];
        var subst = env.subst.clone();

        if (showOnlyCompatible) {
          if (goal.name !== rule.head.name) {
            var newEnv = new Env(["nothing"], [], undefined);
            env.addChild(newEnv);
            continue;
          }
        }

        env.options.currentRuleIndex = env.children.length;
        try {

          env.options.showUnifying = true;
          trace.record();
          delete env.options.showUnifying;

          subst.unify(goal, rule.head);

          var tempSubst = subst.filter(rule.getQueryVarNames().concat(goal.getQueryVarNames()));
          // TODO: make sure all vars are in the right direction
          // tempSubst

          // TODO: replace all variables from query that can ...
          /*
           * query: prereqTrans(P, cs137b)
           * rule: prereqTrans(X', Y') :- prereq(X', Y')
           * subst: P = X', Y' = cs137b
           *
           * newRule: prereqTrans(P, Y') :- prereq(P, Y')
           * newSubst: Y' = cs137b
           * */

          //FIXME
          // this process only happens to body of rules that got unified, does not work with
          // goals: prereq(P, Z'), prereqTrans(Z', cs137b) -> new goals: prereqTrans(Z', cs137b)
          // where no new goal is added
          // seems to be a good thing, see the screen shot

          // reduce equivalent vars in goals and rules
          var varNamesInGoal = goal.getQueryVarNames();
          var reversedSubst = {};
          varNamesInGoal.forEach(varName => {
            var value = subst.lookup(varName);
            if (value.constructor.name === "Var") {
              reversedSubst[value.name] = varName;
              subst.unbind(varName);
            }
          });
          rule = rule.makeCopy({ subst: reversedSubst });

          // remove redundunt substitution form rule, this reduces the #steps for example prereq 171 -> 143
          var varNamesInRule = rule.getQueryVarNames();
          rule.head = rule.head.rewrite(subst);
          rule.body = rule.body.map(c => c.rewrite(subst));

          // unbind removed var names
          var newRuleVarNames = rule.getQueryVarNames();
          var queryVarNames = this.getQueryVarNames();
          var substitutedVarNames = varNamesInRule.filter(varName => newRuleVarNames.indexOf(varName) < 0);
          substitutedVarNames.forEach(varName => {
            if (queryVarNames.indexOf(varName) < 0) {
              subst.unbind(varName);
            }
          });

          var oldRule = rules[env.children.length];


          env.options.showSucceeded = true;

          env.options.substituting = tempSubst; // this is defferent for each rule/children
          // show substitution
          trace.record();
          delete env.options.substituting;

          rules[env.children.length] = rule;

          var newGoals = resolution(rule.body, goals, subst);
          var newEnv = new Env(newGoals, rules, subst, {
            "latestGoals": newGoals.slice(0, rule.body.length),
            "solution": subst.filter(this.getQueryVarNames()).toString(),
            "reversedSubst": reversedSubst,
            "ruleBeforeSubstitution": oldRule.toString(),
            "parentSubst": tempSubst.toString()
            });

          env.addChild(newEnv);
          trace.record();
          delete env.options.showSucceeded;

          delete env.options.currentRuleIndex;
          return solve(newEnv);
        } catch(e) {
          if (e.message !== "unification failed") {
            console.log(e);
          }
          // backtraces
          var newEnv = new Env(["nothing"], [], undefined);
          env.addChild(newEnv);

          env.options.showFailed = true;
          trace.record();
          delete env.options.showFailed;

          delete env.options.currentRuleIndex;
          // backtraces
          trace.record();
        }
      }

      env.options.currentRuleIndex = -1;
      if (env.parent) {
        trace.currentEnv = env.parent;
        trace.record();
      }

      return solve(env.parent);
    }
  };

  return {
    next: function() {
      // console.log("--- next() ---");
      if (trace.currentEnv) {
        return solve(trace.currentEnv);
      }
      return false;
    },
    getTraceIter: function() {
      var tracesCopy = trace.traces.slice();
      var idx = 0;
      var max = tracesCopy.length-1;
      return {
        forward: function() {
          idx = Math.min(max, idx+1);
        },
        backward: function() {
          idx = Math.max(0, idx-1);
        },
        getCurrentTrace: function() {
          return tracesCopy[idx];
        },
        getMax: function() {
          return max;
        },
        getStep: function() {
          return idx;
        },
        setStep: function(step) {
          if (step === undefined) {
            return;
          }
          idx = Math.floor(Math.max(Math.min(step, max), 0));
        }
      };
    }
  };
};
