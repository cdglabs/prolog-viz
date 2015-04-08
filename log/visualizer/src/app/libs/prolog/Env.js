
/**
 * options: exactCopy, reversedSubst
 *
 * currentRuleIndex
 *
 *             "latestGoals": newGoals.slice(0, rule.body.length),
             "solution": subst.filter(self.getQueryVarNames()).toString(),
             "reversedSubst": reversedSubst,
             "ruleBeforeSubstitution": oldRule.toString(),
             "parentSubst": tempSubst.toString()

 */

var validOptions = {
  latestGoals: true,
  solution: true,
  reversedSubst: true,
  ruleBeforeSubstitution: true,
  parentSubst: true,
};

var cloneOptions = options => {
  var clone = {};
  for (var key in options) {
    var value = options[key];
    if (typeof value.clone === "function") {
      clone[key] = value.clone();
    } else {
      clone[key] = value;
    }
  }
  return clone;
};

var envCount = 0;
function Env(goals, rules, subst, options) {
  var cloningFromEnv;
  if (goals.constructor.name === "Env" && arguments.length === 1) {
    cloningFromEnv = goals;
    goals = cloningFromEnv.goals;
    rules = cloningFromEnv.rules;
    subst = cloningFromEnv.subst;

    this.envId = cloningFromEnv.envId;
    this.children = cloningFromEnv.children.map(child => child.clone());
    this.options = cloneOptions(cloningFromEnv.options);
  } else {
    this.envId = envCount;
    envCount++;
    this.children = [];
    this.parent = undefined;
    this.options = options || {};
  }

  // rules
  var newRules;
  if (cloningFromEnv) {
    newRules = rules.map(rule => rule.makeCopy());
  } else {
    var existingVarNames = goals.reduce(function(acc, goal) {
      return goal.constructor.name === "Clause" ? acc.concat(goal.getQueryVarNames()) : acc;
    },[]);
    if (subst) {
      existingVarNames = existingVarNames.concat(Object.keys(subst.bindings));
    }
    newRules = rules.map(rule => {
      if (options && options.reversedSubst) {
        rule = rule.makeCopy({
          subst: options.reversedSubst
        });
      }
      return rule.makeCopy({
        suffix: "'",
        existingVarNames: existingVarNames
      });
    });
  }

  this.goals = goals ? goals.slice() : [];
  this.subst = subst ? subst.clone() : undefined;
  this.rules = rules ? newRules : undefined;
}

Env.prototype.getCurrentRule = function() {
  return this.options.currentRuleIndex !== undefined ? this.rules[this.options.currentRuleIndex] : undefined;
};

Env.prototype.addChild = function(env) {
  this.children.push(env);
  if (env) {
    env.parent = this;
  }
};

Env.prototype.clone = function() {
  return new Env(this);
};

Env.prototype.toString = function() {
  return JSON.stringify(this.clone());
};

module.exports = Env;
