/*
Env = {
  options: {
    numLatestGoals:
    queryVarNames:
    ruleIndex:
  }
  goals:
  subst:
  rules: {
    substituting:
    rewritten
    status:
    interval:
  }
}
*/

var clone = options => {
  var clone = {};
  for (var key in options) {
    clone[key] = options[key];
  }
  return clone;
};

var envCount = 0;
function Env(goals, rules, subst, options) {
  var sourceEnv;
  if (arguments.length === 1 && goals.constructor.name === "Env") {
    sourceEnv = goals;
    goals = sourceEnv.goals;
    rules = sourceEnv.rules;
    subst = sourceEnv.subst;

    this.currentRuleIndex = sourceEnv.currentRuleIndex;
    this.envId = sourceEnv.envId;
    this.children = sourceEnv.children.map(child => child.clone());
    this.options = clone(sourceEnv.options);
  } else {
    this.envId = envCount;
    envCount++;
    this.children = [];
    this.parent = undefined;
    this.options = options || {};
  }

  // rules
  var newRules;
  if (rules) {
    if (sourceEnv) {
      newRules = rules.map(rule => rule.makeCopy());
    } else {
      var existingVarNames = goals.reduce((acc, goal) => goal.constructor.name === "Clause" ? acc.concat(goal.getQueryVarNames()) : acc ,[]);
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
  }

  this.goals = goals ? goals.slice() : undefined;
  this.subst = subst ? subst.clone() : undefined;
  this.rules = newRules;
}

Env.prototype.getCurRule = function() {
  return this.rules[this.options.ruleIndex];
};
Env.prototype.getCurRuleIndex = function() {
  return this.options.ruleIndex;
};
Env.prototype.setCurRuleIndex = function(index) {
  this.options.ruleIndex = Math.max(index, -1);
};

// options

// derived data
Env.prototype.isEmpty = function() {
  return this.goals === undefined && this.rules === undefined && this.subst === undefined;
};

Env.prototype.hasSolution = function() {
  return Array.isArray(this.goals) && this.goals.length === 0;
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
