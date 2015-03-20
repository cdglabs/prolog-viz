// ---------------------------------------------------------
// "Classes" that represent AST nodes
// ---------------------------------------------------------

function Program(rules, query) {
  this.rules = rules;
  this.query = query;
}

function Rule(head, optBody) {
  this.head = head;
  this.body = optBody || [];
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

Subst.prototype.clone = function() {
  var clone = new Subst();
  for (var varName in this.bindings) {
    clone.bind(varName, this.lookup(varName));
  }
  return clone;
};

