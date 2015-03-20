tests(
  L,
  {
    name: 'duh (1/3)',
    code: 'p.\n' +
          'p?',
    expected: makeIterator({})
  },
  {
    name: 'duh (2/3)',
    code: 'p.\n' +
          'q?',
    expected: makeIterator()
  },
  {
    name: 'duh (3/3)',
    code: 'p.\n' +
          'q.\n' +
          'p, q?',
    expected: makeIterator({})
  },
  {
    name: 'alice and bob are people',
    code: 'person(alice).\n' +
          'person(bob).\n' +
          'person(X)?',
    expected: makeIterator(
      { X: new Clause("alice") },
      { X: new Clause("bob") }
    )
  },
  {
    name: 'sick and tired',
    code: 'sick(joe).\n' +
          'sick(frank).\n' +
          'sick(eddie).\n' +
          'tired(joe).\n' +
          'tired(eddie).\n' +
          'sick(X), tired(X)?',
    expected: makeIterator(
      { X: new Clause("joe") },
      { X: new Clause("eddie") }
    )
  },
  {
    name: "prereqs",
    code: 'prereq(cs131, cs137a).\n' +
          'prereq(cs137a, cs137b).\n' +
          'prereqTrans(X, Y) :- prereq(X, Y).\n' +
          'prereqTrans(X, Y) :- prereq(X, Z), prereqTrans(Z, Y).\n' +
          'prereqTrans(P, cs137b)?',
    expected: makeIterator(
      { P: new Clause("cs137a") },
      { P: new Clause("cs131") }
    )
  },
  {
    name: 'nats',
    code: 'nat(z).\n' +
          'nat(s(X)) :- nat(X).\n' +
          'nat(X)?',
    expected: makeIterator(
      { X: new Clause("z") },
      { X: new Clause("s", [new Clause("z")]) },
      { X: new Clause("s", [new Clause("s", [new Clause("z")])]) },
      { X: new Clause("s", [new Clause("s", [new Clause("s", [new Clause("z")])])]) },
      { X: new Clause("s", [new Clause("s", [new Clause("s", [new Clause("s", [new Clause("z")])])])]) }
    )
  },
  {
    name: 'evens',
    code: 'nat(z).\n' +
          'nat(s(X)) :- nat(X).\n' +
          'even(z).\n' +
          'even(s(s(X))) :- even(X).\n' +
          'even(X)?',
    expected: makeIterator(
      { X: new Clause("z") },
      { X: new Clause("s", [new Clause("s", [new Clause("z")])]) },
      { X: new Clause("s", [new Clause("s", [new Clause("s", [new Clause("s", [new Clause("z")])])])]) },
      { X: new Clause("s", [new Clause("s", [new Clause("s", [new Clause("s", [new Clause("s", [new Clause("s", [new Clause("z")])])])])])]) },
      { X: new Clause("s", [new Clause("s", [new Clause("s", [new Clause("s", [new Clause("s", [new Clause("s", [new Clause("s", [new Clause("s", [new Clause("z")])])])])])])])]) }
    )
  },
  {
    name: 'plus (1/3)',
    code: 'plus(z, X, X).\n' +
          'plus(s(X), Y, s(Z)) :- plus(X, Y, Z).\n' +
          'plus(s(z), s(s(z)), X)?\n',
    expected: makeIterator(
      { X: new Clause("s", [new Clause("s", [new Clause("s", [new Clause("z")])])]) }
    )
  },
  {
    name: 'plus (2/3)',
    code: 'plus(z, X, X).\n' +
          'plus(s(X), Y, s(Z)) :- plus(X, Y, Z).\n' +
          'plus(X, s(s(z)), s(s(s(z))))?\n',
    expected: makeIterator(
      { X: new Clause("s", [new Clause("z")]) }
    )
  },
  {
    name: 'plus (3/3)',
    code: 'plus(z, X, X).\n' +
          'plus(s(X), Y, s(Z)) :- plus(X, Y, Z).\n' +
          'plus(s(z), X, s(s(s(z))))?\n',
    expected: makeIterator(
      { X: new Clause("s", [new Clause("s", [new Clause("z")])]) }
    )
  },
  {
    name: 'cons and car',
    code: 'car(cons(X, Y), X).\n' +
          'car(cons(a, nil), X)?',
    expected: makeIterator(
      { X: new Clause("a") }
    )
  },
  {
    name: 'length',
    code: 'length(nil, z).\n' +
          'length(cons(X, L), s(LL)) :- length(L, LL).\n' +
          'length(cons(a, cons(b, cons(c, nil))), X)?',
    expected: makeIterator(
      { X: new Clause("s", [new Clause("s", [new Clause("s", [new Clause("z")])])]) }
    )
  },
  {
    name: "homer's children",
    code: 'father(homer, bart).\n' +
          'father(homer, lisa).\n' +
          'father(homer, maggie).\n' +
          'parent(X, Y) :- father(X, Y).\n' +
          'parent(homer, Y)?',
    expected: makeIterator(
      { Y: new Clause("bart") },
      { Y: new Clause("lisa") },
      { Y: new Clause("maggie") }
    )
  },
  {
    name: "lisa's father",
    code: 'father(homer, bart).\n' +
          'father(homer, lisa).\n' +
          'father(homer, maggie).\n' +
          'parent(X, Y) :- father(X, Y).\n' +
          'parent(X, lisa)?',
    expected: makeIterator(
      { X: new Clause("homer") }
    )
  },
  {
    name: "parent",
    code: 'father(abe, homer).\n' +
          'father(homer, bart).\n' +
          'father(homer, lisa).\n' +
          'father(homer, maggie).\n' +
          'parent(X, Y) :- father(X, Y).\n' +
          'parent(X, Y)?',
    expected: makeIterator(
      { X: new Clause("abe"), Y: new Clause("homer") },
      { X: new Clause("homer"), Y: new Clause("bart") },
      { X: new Clause("homer"), Y: new Clause("lisa") },
      { X: new Clause("homer"), Y: new Clause("maggie") }
    )
  },
  {
    name: "grandfather",
    code: 'father(orville, abe).\n' +
          'father(abe, homer).\n' +
          'father(homer, bart).\n' +
          'father(homer, lisa).\n' +
          'father(homer, maggie).\n' +
          'parent(X, Y) :- father(X, Y).\n' +
          'grandfather(X, Y) :- father(X, Z), parent(Z, Y).\n' +
          'grandfather(X, Y)?',
    expected: makeIterator(
      { X: new Clause("orville"), Y: new Clause("homer") },
      { X: new Clause("abe"), Y: new Clause("bart") },
      { X: new Clause("abe"), Y: new Clause("lisa") },
      { X: new Clause("abe"), Y: new Clause("maggie") }
    )
  }
);

