// var validMeta = {
//   showUnifying: true,
//   showadsf: true,
//   reversedSubst: true,
// };

var validOptions = {
  latestGoals: true,
  solution: true,
  reversedSubst: true,
};

var cloneObject = options => {
  var clone = {};
  for (var key in options) {
    var value = options[key];
    if (typeof value.clone === "function") {
      clone[key] = value.clone();
    } else if (Array.isArray(value)) {
      clone[key] = value.slice();
    } else {
      clone[key] = value;
    }
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

    this.envId = sourceEnv.envId;
    this.children = sourceEnv.children.map(child => child.clone());
    this.options = cloneObject(sourceEnv.options);
    this.meta = cloneObject(sourceEnv.meta);
  } else {
    this.envId = envCount;
    envCount++;
    this.children = [];
    this.parent = undefined;
    this.options = options || {};
    this.meta = {};
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

// meta data
Env.prototype.getCurrentRule = function() {
  return this.meta && this.meta.highlightRuleIndex !== undefined ? this.rules[this.meta.highlightRuleIndex] : undefined;
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
