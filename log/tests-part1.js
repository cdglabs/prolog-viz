tests(
  JS,
  {
    name: 'MCWFVNs preserves structure',
    code: 'var r1 = new Rule(new Clause("p", [new Var("X")]), /* :- */\n' +
          '                  [new Clause("q", [new Var("X"), new Var("Y")])]);\n' +
          'var r2 = r1.makeCopyWithFreshVarNames();\n' +
          'r1.head.args[0] = new Var("X");\n' +
          'r1.body[0].args[0] = new Var("X");\n' +
          'r1.body[0].args[1] = new Var("Y");\n' +
          'r1;',
    expected: new Rule(new Clause("p", [new Var("X")]), /* :- */ [new Clause("q", [new Var("X"), new Var("Y")])])
  },
  {
    name: 'MCWFVNs produces fresh var names',
    code: 'var r1 = new Rule(new Clause("p", [new Var("X")]), /* :- */\n' +
          '                  [new Clause("q", [new Var("X"), new Var("Y")])]);\n' +
          'var r2 = r1.makeCopyWithFreshVarNames();\n' +
          'var v1 = r2.head.args[0];\n' +
          'var v2 = r2.body[0].args[0];\n' +
          'var v3 = r2.body[0].args[1];\n' +
          'v1 instanceof Var && v2 instanceof Var && v3 instanceof Var &&\n' +
          'v1.name !== "X" && v3.name !== "Y" && v1.name === v2.name;',
    expected: true
  },
  {
    name: 'MCWFVNs produces fresh var names every time',
    code: 'var r1 = new Rule(new Clause("p", [new Var("X")]));\n' +
          'var r2 = r1.makeCopyWithFreshVarNames();\n' +
          'var r3 = r2.makeCopyWithFreshVarNames();\n' +
          'var v1 = r1.head.args[0];\n' +
          'var v2 = r2.head.args[0];\n' +
          'var v3 = r3.head.args[0];\n' +
          'v1 instanceof Var && v2 instanceof Var && v3 instanceof Var &&\n' +
          'v1.name !== v2.name && v2.name !== v3.name && v1.name !== v3.name;',
    expected: true
  },
  {
    name: 'rewrite var (1/3)',
    code: 'var s = new Subst().bind("Y", new Clause("foo"));\n' +
          'new Var("X").rewrite(s);',
    expected: new Var("X")
  },
  {
    name: 'rewrite var (2/3)',
    code: 'var s = new Subst().bind("X", new Clause("foo"));\n' +
          'new Var("X").rewrite(s);',
    expected: new Clause("foo")
  },
  {
    name: 'rewrite var (3/3)',
    code: 'var s = new Subst().bind("X", new Clause("foo"));\n' +
          'new Var("Y").rewrite(s);',
    expected: new Var("Y")
  },
  {
    name: 'rewrite clause (1/3)',
    code: 'var s = new Subst().bind("X", new Clause("world"));\n' +
          'new Clause("hello", [new Var("X")]).rewrite(s);',
    expected: new Clause("hello", [new Clause("world")])
  },
  {
    name: 'rewrite clause (2/3)',
    code: 'var s = new Subst().bind("X", new Clause("bar"))\n' +
          '                   .bind("Y", new Clause("qux"));\n' +
          'new Clause("foo", [new Var("X"), new Clause("baz"), new Var("Z")]).rewrite(s);',
    expected: new Clause("foo", [new Clause("bar"), new Clause("baz"), new Var("Z")])
  },
  {
    name: 'rewrite clause (3/3)',
    code: 'var s = new Subst().bind("X", new Clause("bar"))\n' +
          '                   .bind("Y", new Clause("qux"));\n' +
          'new Clause("foo", [new Var("X"), new Clause("baz", [new Var("Y")]), new Var("Y")]).rewrite(s);',
    expected: new Clause("foo", [new Clause("bar"), new Clause("baz", [new Clause("qux")]), new Clause("qux")])
  }
);

