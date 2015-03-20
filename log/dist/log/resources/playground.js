// TODO: make each of the sections (concrete syntax, AST, translation, and result) collapsible independently
// (esp. useful for lectures)

function insertPlayground(L, optSource) {
  var syntaxHighlight = L.grammar && L.grammar.semanticAction({
    number: function(_) {
      conc.doc.markText(
        conc.doc.posFromIndex(this.interval.startIdx),
        conc.doc.posFromIndex(this.interval.endIdx),
        { className: "number" }
      );
    },
    ident: function(_, _) {
      conc.doc.markText(
        conc.doc.posFromIndex(this.interval.startIdx),
        conc.doc.posFromIndex(this.interval.endIdx),
        { className: "ident" }
      );
    },
    keyword: function(_) {
      conc.doc.markText(
        conc.doc.posFromIndex(this.interval.startIdx),
        conc.doc.posFromIndex(this.interval.endIdx),
        { className: "keyword" }
      );
    },
    variable: function(_, _) {
      conc.doc.markText(
        conc.doc.posFromIndex(this.interval.startIdx),
        conc.doc.posFromIndex(this.interval.endIdx),
        { className: "variable" }
      );
    },
    symbol: function(_, _) {
      conc.doc.markText(
        conc.doc.posFromIndex(this.interval.startIdx),
        conc.doc.posFromIndex(this.interval.endIdx),
        { className: "symbol" }
      );
    },
    comment: function(_) {
      conc.doc.markText(
        conc.doc.posFromIndex(this.interval.startIdx),
        conc.doc.posFromIndex(this.interval.endIdx),
        { className: "comment" }
      );
    },
    _list: ohm.actions.map,
    _terminal: function() {},
    _default: ohm.actions.passThrough
  });

  var playground = toDOM(["table"]);
  playground.className = "playground";

  var scripts = document.getElementsByTagName("script");
  var thisScriptTag = scripts[scripts.length - 1];
  thisScriptTag.parentNode.appendChild(playground);

  function addEditor(label, width, height, optReadOnly) {
    var editorTd = toDOM(["td"]);
    playground.appendChild(toDOM(["tr", ["td", label], editorTd]));
    var editor = CodeMirror(editorTd, {
      readOnly: optReadOnly,
      value: "",
      mode: "text/plain",
      enterMode: "flat",
      electricChars: false,
      lineNumbers: true,
      smartIndent: false,
      lineSpacing: 1.1
    });
    editor.setSize(width, height);
    return editor;
  }

  var conc = addEditor("concrete syntax", 630, 300);
  var abs = L.parse ? addEditor("abstract syntax", 630, 200, true) : undefined;
  var trans = L.transAST ? addEditor("translation", 630, 200, true) : undefined;
  var res = addEditor("result", 630, 100, true);

  function clearEverythingElse() {
    if (abs) {
      abs.setValue("");
    }
    if (trans) {
      trans.setValue("");
    }
    res.setValue("");
  }
    
  conc.on("change", function() { haveSource(conc.getValue()); });
  if (optSource) {
    conc.setValue(optSource);
  }

  var parseErrorWidget;
  function haveSource(src) {
    if (parseErrorWidget) {
      conc.removeLineWidget(parseErrorWidget);
      parseErrorWidget = undefined;
    }
    conc.getAllMarks().forEach(function(mark) { mark.clear(); });

    var src = conc.getValue();
    if (L.grammar) {
      syntaxHighlight(L.grammar.matchContents(src, 'tokens'));
    }
    if (src.trim().length === 0) {
      clearEverythingElse();
      return;
    }
    if (L.parse) {
      var ast;
      try {
        ast = L.parse(src);
      } catch (e) {
        if (e instanceof ohm.error.MatchFailure) {
          showSyntaxError(e, src);
        } else {
          clearEverythingElse();
          abs.setValue(showException(e));
        }
        return;
      }
      haveAST(ast);
    } else {
      callAndShowResult(function() { return JS.eval(src); });
    }
  }

  function haveAST(ast) {
    abs.setValue(L.prettyPrintAST(ast));
    if (L.transAST) {
      var code;
      try {
        code = L.transAST(ast);
        trans.setValue(prettyPrintJS(code));
      } catch (e) {
        trans.setValue(showException(e));
        return;
      }
      callAndShowResult(function() { return JS.eval(code); });
    } else {
      callAndShowResult(function() { return L.evalAST(ast); });
    }
  }

  function callAndShowResult(thunk) {
    try {
      haveResult(thunk());
    } catch (e) {
      res.setValue(showException(e));
    }
  }

  function haveResult(value) {
    res.setValue(L.prettyPrintValue(value));
  }

  function showSyntaxError(e, src) {
    setTimeout(
      function() {
        if (conc.getValue() === src && !parseErrorWidget) {
          function repeat(x, n) {
            var xs = [];
            while (n-- > 0) {
              xs.push(x);
            }
            return xs.join('');
          }
          var msg = 'Expected: ' + e.getExpectedText();
          var pos = conc.doc.posFromIndex(e.getPos());
          var error = toDOM(['parseError', repeat(' ', pos.ch) + '^\n' + msg]);
          parseErrorWidget = conc.addLineWidget(pos.line, error);
          $(error).hide().slideDown();
        }
      },
      2500
    );
  }

  function showException(e) {
    return e.hasOwnProperty('stack') ?
      e.stack :
     'Uncaught exception: ' + e.toString();
  }
}

// insertPlayground('6 * 7')

