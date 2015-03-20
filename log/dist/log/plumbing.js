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

Program.prototype.getQueryVarNames = function() {
  var varNames = Object.create(null);
  this.query.forEach(function(clause) {
    clause.recordVarNames(varNames);
  });
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

