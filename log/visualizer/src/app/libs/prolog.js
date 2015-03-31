var ohm = require('./ohm.min.js');

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



// ---------------------------------------------------------
// "Classes" that represent AST nodes
// ---------------------------------------------------------

function Program(rules, query) {
  this.rules = rules;
  this.query = query;
}

function Rule(head, optBody, interval) {
  this.head = head;
  this.body = optBody || [];
  this.interval = interval;
}

function Clause(name, optArgs) {
  this.name = name;
  this.args = optArgs || [];
}

function Var(name) {
  this.name = name;
}

// ---------------------------------------------------------
// Substitutions
// ---------------------------------------------------------

function Subst() {
  this.bindings = Object.create(null);
};

Subst.prototype.lookup = function(varName) {
  return this.bindings[varName];
};

Subst.prototype.bind = function(varName, term) {
  this.bindings[varName] = term;
  return this;
};

Subst.prototype.unbind = function(varName) {
  // this.bindings[varName] = undefined;
  delete this.bindings[varName];
  return this;
};

Subst.prototype.clone = function() {
  var clone = new Subst();
  for (var varName in this.bindings) {
    clone.bind(varName, this.lookup(varName));
  }
  return clone;
};

// -----------------------------------------------------------------------------
// Part I: Rule.prototype.makeCopyWithFreshVarNames() and
//         {Clause, Var}.prototype.rewrite(subst)
// -----------------------------------------------------------------------------

function makeCopyOfClauseWithFreshVarNames(c, suffix, skipSuffixForVarNames) {
  // TODO: args : an array of terms (a term is either a Clause or a Var)
  return new Clause(c.name, c.args.map(function(term) {
    switch (term.constructor.name) {
      case "Var":
        if (skipSuffixForVarNames.indexOf(term.name) < 0) {
          return new Var(term.name+suffix);
        } else {
          return new Var(term.name);
        }
        break;
      case "Clause":
        return makeCopyOfClauseWithFreshVarNames(term, suffix, skipSuffixForVarNames);
      default:
        return null;
    }
  }));
}

var nameCount = 0;
Rule.prototype.makeCopyWithFreshVarNames = function(suffix, existingVarNames) {
  if (suffix === undefined) {
    suffix = "_"+nameCount;
    nameCount++;
  }
  var ruleVarNames = this.getQueryVarNames();
  var skipSuffixForVarNames = ruleVarNames.filter(function(varName) {
    return existingVarNames.indexOf(varName) < 0;
  });

  var head = makeCopyOfClauseWithFreshVarNames(this.head, suffix, skipSuffixForVarNames);
  var body = this.body.map(function(c) {
    return makeCopyOfClauseWithFreshVarNames(c, suffix, skipSuffixForVarNames);
  });
  return new Rule(head, body, this.interval);
};

function makeCopyOfClauseWithNewVarNames(c, subst) {
  // TODO: args : an array of terms (a term is either a Clause or a Var)
  return new Clause(c.name, c.args.map(function(term) {
    switch (term.constructor.name) {
      case "Var":
        if (subst[term.name]) {
          return new Var(subst[term.name]);
        }
        return new Var(term.name);
      case "Clause":
        return makeCopyOfClauseWithNewVarNames(term, subst);
      default:
        return null;
    }
  }));
}

Rule.prototype.makeCopyWithNewVarNames = function(subst) {
  var head = makeCopyOfClauseWithNewVarNames(this.head, subst);
  var body = this.body.map(function(c) {
    return makeCopyOfClauseWithNewVarNames(c, subst);
  });
  return new Rule(head, body, this.interval);
};

Clause.prototype.rewrite = function(subst) {
  var args = this.args.map(function(term) {
    // console.log(subst);
    return term.rewrite(subst);
  });
  var newClause = new Clause(this.name, args);
  return newClause;
};

function checkCircular(name, term) {
  if (term && term.constructor.name === "Var" && term.name === name) {
    return true;
  } else if (term && term.constructor.name === "Clause") {
    return term.args.some(function(term) {
      return checkCircular(name, term);
    });
  }
}

Var.prototype.rewrite = function(subst) {
  var thisName = this.name;
  var value = subst.lookup(thisName);
  if (value && value.constructor.name === "Clause") {
    if (!checkCircular(thisName, value)) {
      return value.rewrite(subst);
    }
  }
  return new Var(thisName);
};

// -----------------------------------------------------------------------------
// Part II: Subst.prototype.unify(term1, term2)
// -----------------------------------------------------------------------------

Subst.prototype.unify = function(term1, term2) {
  var term1 = term1.rewrite(this);
  var term2 = term2.rewrite(this);
  // console.log("unifying term1: "+JSON.stringify(term1)+" term2: "+JSON.stringify(term2));
  if (term1.constructor.name === "Var" && term2.constructor.name === "Var") {
    if (term1.name === term2.name) {
      return this;
    }
    if (this.lookup(term1.name)) {
      this.bind(term2.name, this.lookup(term1.name));
    } if (this.lookup(term2.name)) {
      this.bind(term1.name, this.lookup(term2.name));
    } else {
      this.bind(term1.name, term2);
    }
  } else if (term1.constructor.name === "Var" && term2.constructor.name === "Clause") {
    this.bind(term1.name, term2);
  } else if (term1.constructor.name === "Clause" && term2.constructor.name === "Var") {
    this.bind(term2.name, term1);
  } else if (term1.constructor.name === "Clause" && term2.constructor.name === "Clause" &&
    term1.name === term2.name && term1.args.length === term2.args.length) {

    for (var i = 0; i < term1.args.length; i++) {
      // TODO: failed case?
      this.unify(term1.args[i], term2.args[i]);
    }

  } else {
    throw new Error("unification failed");
  }

  // console.log("unified subst: "+JSON.stringify(this));

  for (var varName in this.bindings) {
    this.bind(varName, this.lookup(varName).rewrite(this));
  }
  return this;
};

// -----------------------------------------------------------------------------
// Part III: Program.prototype.solve()
// -----------------------------------------------------------------------------

var envCount = 0;
function Env(goals, rules, subst, options) {
  this.envId = envCount;
  envCount++;
  this.goals = goals ? goals.slice() : [];
  this.subst = subst ? subst.clone() : undefined;

  var existingVarNames = goals.reduce(function(acc, goal) {
    if (goal.constructor.name === "Clause") {
      return acc.concat(goal.getQueryVarNames());
    }
    return acc;
  },[]);
  if (subst) {
    existingVarNames = existingVarNames.concat(Object.keys(subst.bindings));
  }

  this.rules = rules ? rules.map(function(rule, i) {
    var newRule = rule;
    if (options && options.reversedSubst) {
      newRule = rule.makeCopyWithNewVarNames(options.reversedSubst);//.makeCopyWithFreshVarNames("'");
    }
    return newRule.makeCopyWithFreshVarNames("'", existingVarNames);
  }) : undefined;

  this.children = [];
  this.parent = undefined;
  this.options = options;
}

Env.prototype.addChild = function(env) {
  this.children.push(env);
  if (env) {
    env.parent = this;
  }
};

// Pretty Print

Env.prototype.copyWithoutParent = function() {
  var clone = Object.create(this);
  clone.parent = null;
  clone.envId = this.envId;
  clone.goals = this.goals.map(function(goal) {
    return goal.toString();
  });
  if (this.subst) {
    clone.subst = {};
    for (var key in this.subst.bindings) {
      clone.subst[key] = this.subst.bindings[key].toString();
    }
  }
  if (this.rules) {
    clone.rules = this.rules.map(function(rule) {
      return rule.toString();
    });
  }
  clone.solution = this.solution;
  clone.options = this.options;
  clone.children = clone.children.map(function(child) {
    return (child && child.constructor.name === "Env") ? child.copyWithoutParent() : {
      goals: ["nothing"],
      children: []
    };
  });
  return clone;
};

Env.prototype.toString = function() {
  return JSON.stringify(this.copyWithoutParent());
};

var count = 0;
Program.prototype.solve = function(showOnlyCompatible) {
  console.log("=== solve#"+count+" ===");
  count++;

  var self = this;

  var rules = this.rules;
  var goals = this.query;
  var subst = new Subst();

  var rootEnv = new Env(goals, rules, subst);
  var currentEnv = rootEnv;

  var traces = [];
  traces.push({
    rootEnv: JSON.parse(rootEnv.toString()),
    currentEnv: JSON.parse(currentEnv.toString())
  });

  // skip duplicated solutions
  var solutions = [];

  var resolution = function(body, goals, subst) {
    var newGoals = body.slice();
    var goalsTail = goals.slice(1);
    if (Array.isArray(goalsTail)) {
      Array.prototype.push.apply(newGoals, goalsTail);
    }
    newGoals = newGoals.map(function(term) {
      return term.rewrite(subst);
    });
    return newGoals;
  };

  var TIME_LIMIT = 500; // ms
  var startTime = Date.now();
  var solve = function(env) {
    var elapsedTime = Date.now() - startTime;
    if (elapsedTime > TIME_LIMIT) {
      return false;
    }

    if (!env || env.constructor.name !== "Env") {
      return false;
    }

    if (currentEnv === env && currentEnv !== rootEnv) {
      return solve(currentEnv.parent);
    } else {
      currentEnv = env;
    }

    var goals = env.goals;
    var rules = env.rules;
    if (goals.length === 0) {

      var solution = env.subst.filter(self.getQueryVarNames()).toString();//JSON.stringify(env.subst.filter(self.getQueryVarNames()));
      env.solution = solution;

      if (env.parent) {
        traces.push({
          rootEnv: JSON.parse(rootEnv.toString()),
          currentEnv: JSON.parse(env.parent.toString())
        });
      }

      if (solutions.indexOf(solution) < 0) {
        solutions.push(solution);
        return env.subst;
      }
    } else {
      while (env.children.length < rules.length) {
        var goal = goals[0];
        var rule = rules[env.children.length];

        if (showOnlyCompatible) {
          if (goal.name !== rule.head.name) {
            var newEnv = new Env(["nothing"], [], undefined);
            env.addChild(newEnv);
            continue;
          }
        }

        var subst = env.subst.clone();
        try {

          traces.push({
            rootEnv: JSON.parse(rootEnv.toString()),
            currentEnv: JSON.parse(env.toString()),
            currentRule: rule,
            status: "BEFORE",
          });

          subst.unify(goal, rule.head);

          // var oldRule = assign(rule);
          var tempSubst = subst.filter(rule.getQueryVarNames().concat(goal.getQueryVarNames()));

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
          varNamesInGoal.forEach(function(varName) {
            var value = subst.lookup(varName);
            if (value.constructor.name === "Var") {
              reversedSubst[value.name] = varName;
              subst.unbind(varName);
            }
          });
          rule = rule.makeCopyWithNewVarNames(reversedSubst);

          // remove redundunt substitution form rule, this reduces the #steps for example prereq 171 -> 143
          var varNamesInRule = rule.getQueryVarNames();
          rule.head = rule.head.rewrite(subst);
          rule.body = rule.body.map(function(c) {
            return c.rewrite(subst);
          });
          var newRuleVarNames = rule.getQueryVarNames();
          var queryVarNames = self.getQueryVarNames();
          var substitutedVarNames = varNamesInRule.filter(function(varName) {return newRuleVarNames.indexOf(varName) < 0;});
          substitutedVarNames.forEach(function(varName) {
            if (queryVarNames.indexOf(varName) < 0) {
              subst.unbind(varName);
            }
          });



          // rules[env.children.length] = oldRule;
          // rules[env.children.length] = rule;

          // show subsitution
          traces.push({
            rootEnv: JSON.parse(rootEnv.toString()),
            currentEnv: JSON.parse(env.toString()),
            currentRule: rules[env.children.length],//rule,
            status: "SUBST",
            subst: tempSubst
          });

          rules[env.children.length] = rule;

          var newGoals = resolution(rule.body, goals, subst);
          var newEnv = new Env(newGoals, rules, subst, {
            "latestGoals": newGoals.slice(0, rule.body.length),
            "solution": subst.filter(self.getQueryVarNames()).toString(),
            "reversedSubst": reversedSubst,
            });

          env.addChild(newEnv);

          var trace = {
            rootEnv: JSON.parse(rootEnv.toString()),
            currentEnv: JSON.parse(env.toString()),
            currentRule: rule,
            status: "NEW_GOAL",
          };
          traces.push(trace);

          // show unification succeeded
          // traces.push({
          //   rootEnv: JSON.parse(rootEnv.toString()),
          //   currentEnv: JSON.parse(env.toString()),
          //   // currentRule: rule,
          //   // status: "SUCCESS",
          // });

          return solve(newEnv);
        } catch(e) {
          // console.log(e);
          // backtraces
          var newEnv = new Env(["nothing"], [], undefined);
          env.addChild(newEnv);

          var rootEnvAfter = JSON.parse(rootEnv.toString());
          traces.push({
            rootEnv: rootEnvAfter,
            currentEnv: JSON.parse(env.toString()),
            currentRule: rule,
            status: "FAILURE",
          });
          // backtraces
          traces.push({
            rootEnv: rootEnvAfter,
            currentEnv: JSON.parse(env.toString())
          });
        }
      }

      if (env.parent) {
        traces.push({
          rootEnv: JSON.parse(rootEnv.toString()),
          currentEnv: JSON.parse(env.parent.toString()),
        });
      }
      return solve(env.parent);
    }
  };

  return {
    next: function() {
      // console.log("--- next() ---");
      if (currentEnv) {
        return solve(currentEnv);
      }
      return false;
    },
    getRootEnv: function() {
      var ret = JSON.parse(rootEnv.toString());
      // console.log(JSON.stringify(ret, null, '\t'));
      // console.log(JSON.stringify(traces, null, '\t'));
      return ret;
      // or rootEnv.copyWithoutParent();
    },
    getTraceIter: function() {
      var tracesCopy = traces.slice();
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


// -----------------------------------------------------------------------------
// Plumbing!
// -----------------------------------------------------------------------------

// Note: these methods are not really part of your prototype, they're just the
// "plumbing" that's required to hook up your prototype to our test harness,
// playground, etc.

Subst.prototype.toString = function() {
  var output = [];
  var first = true;
  for (var v in this.bindings) {
    if (first) {
      first = false;
    } else {
      output.push(", ");
    }
    output.push(v + " = " + this.bindings[v]);
  }
  if (first) {
    output.push("yes");
  }
  return output.join("");
};

Subst.prototype.filter = function(names) {
  var ans = new Subst();
  for (var idx = 0; idx < names.length; idx++) {
    var name = names[idx];
    var term = this.lookup(name);
    if (term) {
      ans.bind(name, term);
    }
  }
  return ans;
};

Program.prototype.getQueryVarNames = function() {
  var varNames = Object.create(null);
  this.query.forEach(function(clause) {
    clause.recordVarNames(varNames);
  });
  return Object.keys(varNames);
};

Rule.prototype.getQueryVarNames = function() {
  var varNames = Object.create(null);
  this.head.recordVarNames(varNames);
  this.body.forEach(function(c) {
    c.recordVarNames(varNames);
  });
  return Object.keys(varNames);
};

Clause.prototype.getQueryVarNames = function() {
  var varNames = Object.create(null);
  this.recordVarNames(varNames);
  return Object.keys(varNames);
};

Clause.prototype.recordVarNames = function(varNames) {
  this.args.forEach(function(arg) {
    arg.recordVarNames(varNames);
  });
};

Var.prototype.recordVarNames = function(varNames) {
  varNames[this.name] = true;
};

// JS.prettyPrintValue = function(x) {
//   return x instanceof Program || x instanceof Rule || x instanceof Clause || x instanceof Var ?
//     L.prettyPrintAST(x) :
//     String(x);
// };

// --------------------------------------------------------------

Rule.prototype.toString = function() {
  var ret = this.head.toString();
  if (this.body.length > 0) {
    ret += " :- "+this.body.map(function(term) {
      return term.toString();
    }).join(", ");
  }
  return ret;
};

Clause.prototype.toString = function() {
  return this.args.length === 0 ?
    this.name :
    this.name + "(" + this.args.map(function(arg) { return arg.toString(); }).join(", ") + ")";
};

Var.prototype.toString = function() {
  return this.name;
};
