// Poor man's test harness

function TODO(message) {
  var e = new Error(message);
  this.message = message;
  Object.defineProperty(this, "stack", {
    get: function() { return e.stack; }
  });
}

TODO.prototype = Object.create(Error.prototype);
TODO.prototype.constructor = TODO;

function tests(L /* , testCase1, testCase2, ... */) {
  var numTests = arguments.length - 1;
  var numPasses = 0;
  var tests = toDOM(["testCases"]);

  for (var idx = 1; idx < arguments.length; idx++) {
    var testCase = arguments[idx];
    var actualValue;
    var exception = undefined;
    var details = ["details", ["summary", testCase.name], ["code", testCase.code]];
    try {
      if (L.parse) {
        var ast = L.parse(testCase.code);
        details.push(["ast", L.prettyPrintAST(ast)]);
        if (L.transAST) {
          var translation = prettyPrintJS(L.transAST(ast));
          details.push(["translation", ["conc", translation]]);
          actualValue = JS.eval(translation);
        } else {
          actualValue = L.evalAST(ast);
        }
      } else {
        actualValue = JS.eval(testCase.code);
      }
      details.push(["actual", ["conc", L.prettyPrintValue(actualValue)]]);
    } catch (e) {
      exception = e;
      details.push(["exception", ["conc", e.toString()]]);
      if (!testCase.shouldThrow) {
        console.info("test", JSON.stringify(testCase.name), "threw", e);
      }
    }
    details.push(
      ["expected", testCase.shouldThrow ?  ["span", "an exception"] : ["conc", L.prettyPrintValue(testCase.expected)]]);
    var node = toDOM(["testCase", details])
    tests.appendChild(node);
    if (exception && testCase.shouldThrow && !(exception instanceof TODO) ||
        !exception && equals(actualValue, testCase.expected)) {
      numPasses++;
    } else {
      node.className = "failed";
    }
  }

  tests.insertBefore(
    toDOM(
      ["testStats",
        ["numPasses", numPasses],
        ["numTests", numTests]]
    ),
    tests.firstChild
  );

  var scripts = document.getElementsByTagName("script");
  var thisScriptTag = scripts[scripts.length - 1];
  thisScriptTag.parentNode.appendChild(tests);
}

