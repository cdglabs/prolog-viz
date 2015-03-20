JS.prettyPrintValue = function(x) {
  return x instanceof Program || x instanceof Rule || x instanceof Clause || x instanceof Var ?
    L.prettyPrintAST(x) :
    String(x);
};

// --------------------------------------------------------------

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

Clause.prototype.toString = function() {
  return this.args.length === 0 ?
    this.name :
    this.name + "(" + this.args.map(function(arg) { return arg.toString(); }).join(", ") + ")";
};

Var.prototype.toString = function() {
  return this.name;
};

// --------------------------------------------------------------

L.prettyPrintAST = function(ast) {
  var strm = new IndentingOutputStream();
  ast.prettyPrint(strm);
  return strm.contents();
};

Program.prototype.prettyPrint = function(strm) {
  strm.indentFromHere();
  strm.write("new Program(");
  strm.nl();
  strm.write("/* rules */");
  strm.nl();
  prettyPrintList(this.rules, strm);
  strm.write(",");
  strm.nl();
  strm.write("/* query */");
  strm.nl();
  prettyPrintList(this.query, strm);
  strm.write(")");
  strm.dedent();
};

Rule.prototype.prettyPrint = function(strm) {
  strm.indentFromHere();
  strm.write("new Rule(");
  strm.nl();
  this.head.prettyPrint(strm);
  if (this.body.length > 0) {
    strm.write(", /* :- */");
    strm.nl();
    prettyPrintList(this.body, strm);
  }
  strm.write(")");
  strm.dedent();
};

Clause.prototype.prettyPrint = function(strm) {
  strm.write('new Clause("' + this.name + '"');
  if (this.args.length > 0) {
    strm.write(", [");
    for (var idx = 0; idx < this.args.length; idx++) {
      if (idx > 0) {
        strm.write(", ");
      }
      this.args[idx].prettyPrint(strm);
    }
    strm.write("]");
  }
  strm.write(")");
};

Var.prototype.prettyPrint = function(strm) {
  strm.write('new Var("' + this.name + '")');
};
  
function prettyPrintList(xs, strm) {
  strm.write("[");
  strm.indentToHere();
  for (var idx = 0; idx < xs.length; idx++) {
    if (idx > 0) {
      strm.write(",");
      strm.nl();
    }
    xs[idx].prettyPrint(strm);
  }
  strm.dedent();
  strm.write("]");
}

