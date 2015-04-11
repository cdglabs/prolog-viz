var React = require('react');
var Classable = require('../../mixins/classable.js');
var assign = require('object-assign');
var Router = require('react-router');
var urlencode = require('urlencode');

var CodeMirror = require('./ReactCodeMirror.jsx');
var ohm = require('../../libs/ohm.min.js');

var EditorStore = require('../../stores/EditorStore.js');
var EditorActionCreators = require('../../actions/EditorActionCreators.js');
var ExamplesStore = require('../../stores/ExamplesStore.js');

function getStateFromStores() {
  return {
    text : EditorStore.getText(),
    L: EditorStore.getInterpreter(),
    program: EditorStore.getProgram(),
    traceIter: EditorStore.getTraceIter(),
    syntaxError: EditorStore.getSyntaxError(),
    examples : ExamplesStore.getExamples(),
  };
}

var Input = React.createClass({
  mixins: [Classable, Router.State, Router.Navigation],

  contextTypes: {
    router: React.PropTypes.func
  },

  getInitialState: function() {
    return getStateFromStores();
  },

  componentDidMount: function() {
    EditorStore.addChangeListener(this._onChange);
    // this.refs.codeMirror.editor.on('cursorActivity', this.handleCursorActivity);

    // var L = this.state.L;
    // this.syntaxHighlight = L.grammar && L.grammar.semanticAction({
    //   number: function(_) {
    //     cm.doc.markText(
    //       cm.doc.posFromIndex(this.interval.startIdx),
    //       cm.doc.posFromIndex(this.interval.endIdx),
    //       { className: "number" }
    //     );
    //   },
    //   ident: function(_, _) {
    //     cm.doc.markText(
    //       cm.doc.posFromIndex(this.interval.startIdx),
    //       cm.doc.posFromIndex(this.interval.endIdx),
    //       { className: "ident" }
    //     );
    //   },
    //   keyword: function(_) {
    //     cm.doc.markText(
    //       cm.doc.posFromIndex(this.interval.startIdx),
    //       cm.doc.posFromIndex(this.interval.endIdx),
    //       { className: "keyword" }
    //     );
    //   },
    //   variable: function(_, _) {
    //     cm.doc.markText(
    //       cm.doc.posFromIndex(this.interval.startIdx),
    //       cm.doc.posFromIndex(this.interval.endIdx),
    //       { className: "variable" }
    //     );
    //   },
    //   symbol: function(_, _) {
    //     cm.doc.markText(
    //       cm.doc.posFromIndex(this.interval.startIdx),
    //       cm.doc.posFromIndex(this.interval.endIdx),
    //       { className: "symbol" }
    //     );
    //   },
    //   comment: function(_) {
    //     cm.doc.markText(
    //       cm.doc.posFromIndex(this.interval.startIdx),
    //       cm.doc.posFromIndex(this.interval.endIdx),
    //       { className: "comment" }
    //     );
    //   },
    //   _list: ohm.actions.map,
    //   _terminal: function() {},
    //   _default: ohm.actions.passThrough
    // });

  },

  componentWillUnmount: function() {
    EditorStore.removeChangeListener(this._onChange);
  },

  /**
   * Event handler for 'change' events coming from the stores
   */
  _onChange: function() {
    var newState = getStateFromStores();
    var cm = this.refs.codeMirror.editor;
    if (cm) {
      if (newState.text !== cm.getValue()) {
        cm.setValue(newState.text);
      }
    }
    this.setState(newState);
  },

  propTypes: {
    // value: React.PropTypes.string.isRequired,
  },

  componentDidUpdate: function() {

    var exampleName = urlencode.decode(this.getParams().exampelName);
    if (exampleName) {
      var text;
      this.state.examples.forEach(function(example) {
        if (example.name === exampleName) {
          text = example.code;
        }
      });
      if (text) {
        var cm = this.refs.codeMirror.editor;
        if (cm) {
          if (text !== cm.getValue()) {
            this.showingExample = true;
            cm.setValue(text);
            this.showingExample = false;
          }
        }
      }
    }

    var traceIter = this.state.traceIter;
    var syntaxError = this.state.syntaxError;
    var syntaxHighlight = this.state.syntaxHighlight;

    if (traceIter) {
      var trace = traceIter.getCurrentTrace();
      if (trace.message && !syntaxError) {
        switch(trace.message) {
          case "1":
            this.highlight(trace, 'highlightRuleBefore');
            break;
          case "2.1":
          case "3":
            this.highlight(trace, 'highlightRuleSuccess');
            break;
          case "2.2":
            this.highlight(trace, 'highlightRuleFailure');
            break;
          default:
            this.highlight();
            break;
        }
      } else {
        this.highlight();
      }
    }

    var cm = this.refs.codeMirror.editor;
    this.showSyntaxError(syntaxError, cm.getValue());
    if (syntaxHighlight) {
    }
  },

  showSyntaxError: function(e, src) {
    var cm = this.refs.codeMirror.editor;
    setTimeout(() => {
        if (this.lineWidget) {
          cm.removeLineWidget(this.lineWidget);
        }
        if (e && cm.getValue() === src) {
          var repeat = function(x, n) {
            var xs = [];
            while (n-- > 0) {
              xs.push(x);
            }
            return xs.join('');
          };
          var msg = 'Expected: ' + e.getExpectedText();
          var pos = cm.posFromIndex(e.getPos());
          var msgEl = document.createElement("div");
          msgEl.className = "errorMsg";
          msgEl.appendChild(document.createTextNode(repeat(' ', pos.ch) + '^\n' + msg));
          this.lineWidget = cm.addLineWidget(pos.line, msgEl, {coverGutter: false, noHScroll: true});
        }
      },
      500
    );
  },

  highlight: function(trace, className) {
    var cm = this.refs.codeMirror.editor;
    cm.getAllMarks().forEach(function(m) { m.clear(); });

    if (trace) {
      var currentRule = trace.currentEnv.getCurRule();
      var interval = currentRule ? currentRule.interval : undefined;
      if (interval) {
        var startPos = cm.posFromIndex(interval.startIdx),
            endPos = cm.posFromIndex(interval.endIdx);
        cm.markText(startPos, endPos, { className: className });
      }
    }
  },

  onEditorTextChange: function(e) {
    this.highlight();

    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    if (this.showingExample) {
      // EditorActionCreators.changeText(e.target.value);
      EditorActionCreators.changeText(e.target.value);

    } else {
      // the change is caused by user input
      this.timeout = setTimeout(() => {
        this.replaceWith('root');
        EditorActionCreators.changeText(e.target.value);
      }, 500);
    }
  },

  render: function() {
    var classes = this.getClasses('input', {
    });

    var props = {
      // lineWrapping: true,
      viewportMargin: Infinity,
      lineNumbers: true,
      onChange: this.onEditorTextChange,
      defaultValue: this.state.text,
      height: "dynamic",
      minHeight: 600,
    };

    return (
      <div className={classes} >
        <CodeMirror className="cm" ref="codeMirror" {...props}/>
      </div>
      );
    }
});

module.exports = Input;
