var React = require('react');
var Classable = require('../../mixins/classable.js');
var assign = require('object-assign');

var CodeMirror = require('react-code-mirror');
var ohm = require('../../libs/ohm.min.js');

var EditorStore = require('../../stores/EditorStore.js');
var EditorActionCreators = require('../../actions/EditorActionCreators.js');

function getStateFromStores() {
  return {
    text : EditorStore.getText(),
    L: EditorStore.getInterpreter(),
    program: EditorStore.getProgram(),
    traceIter: EditorStore.getTraceIter(),
    syntaxError: EditorStore.getSyntaxError(),
    syntaxHighlight: EditorStore.getSyntaxHighlight(),
    matchTrace: EditorStore.getMatchTrace(),
  };
}

var Input = React.createClass({
  mixins: [Classable],

  getInitialState: function() {
    return getStateFromStores();
  },

  componentDidMount: function() {
    EditorStore.addChangeListener(this._onChange);
    // this.refs.codeMirror.editor.on('cursorActivity', this.handleCursorActivity);
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
    var traceIter = this.state.traceIter;
    if (traceIter) {
      var trace = traceIter.getCurrentTrace();
      if (trace.currentRule) {
        switch(trace.status) {
          case "BEFORE":
          case "REWRITING_HEAD":
            this.highlight(trace, 'highlightRuleBefore');
            break;
          case "SUCCESS":
          case "SUBST":
          case "REWRITING_BODY":
          case "NEW_GOAL":
            this.highlight(trace, 'highlightRuleSuccess');
            break;
          case "FAILURE":
            this.highlight(trace, 'highlightRuleFailure');
            break;
          default:
            this.highlight();
        }
      } else {
        this.highlight();
      }
    }

    var syntaxError = this.state.syntaxError;
    var syntaxHighlight = this.state.syntaxHighlight;
    if (syntaxError) {
      this.highlight();
      console.log(syntaxError);
    }
    var cm = this.refs.codeMirror.editor;
    this.showSyntaxError(syntaxError, cm.getValue());
    if (syntaxHighlight) {
      // syntaxHighlight(this.state.matchTrace);
    }

  },

  showSyntaxError: function(e, src) {
    var cm = this.refs.codeMirror.editor;
    var self = this;
    setTimeout(
      function() {
        if (self.lineWidget) {
          cm.removeLineWidget(self.lineWidget);
        }
        if (e && cm.getValue() === src) {
          function repeat(x, n) {
            var xs = [];
            while (n-- > 0) {
              xs.push(x);
            }
            return xs.join('');
          }
          var msg = 'Expected: ' + e.getExpectedText();
          var pos = cm.posFromIndex(e.getPos());
          // var error = toDOM(['parseError', repeat(' ', pos.ch) + '^\n' + msg]);
          // parseErrorWidget = conc.addLineWidget(pos.line, error);
          // $(error).hide().slideDown();
          var msgEl = document.createElement("div");
          msgEl.className = "errorMsg";
          msgEl.appendChild(document.createTextNode(repeat(' ', pos.ch) + '^\n' + msg));

          self.lineWidget = cm.addLineWidget(pos.line, msgEl, {coverGutter: false, noHScroll: true});
        }
      },
      500
    );
  },

  highlight: function(trace, className) {
    var cm = this.refs.codeMirror.editor;
    cm.getAllMarks().forEach(function(m) { m.clear(); });

    var interval = trace && trace.currentRule ? trace.currentRule.interval : undefined;

    if (cm && interval) {
      var startPos = cm.posFromIndex(interval.startIdx),
          endPos = cm.posFromIndex(interval.endIdx);
      cm.markText(startPos, endPos, { className: className });

      // this.highlightWidget(trace, endPos.line);
    } else {
      // this.highlightWidget();

      // console.log("code mirror not available");
    }
  },

  highlightWidget: function(trace, line) {
    var cm = this.refs.codeMirror.editor;
    if (this.lineWidget) {
      cm.removeLineWidget(this.lineWidget);
    }

    if (!trace) {
      return;
    }

    var msg = "";

    // if (trace.rewrittenHead && !trace.rewrittenBody) {
    //   msg += trace.rewrittenHead.toString()+"\n";
    // }
    //
    // if (trace.rewrittenHead && trace.rewrittenBody) {
    //   msg += trace.rewrittenHead.toString()+" :- "+trace.rewrittenBody.toString()+"\n";
    // }

    if (trace.currentRule) {
      msg += trace.currentRule.toString() + " -- Renamed rule\n";
    }

    if (trace.goal) {
      msg += trace.goal.toString();
    }
    if (trace.subst) {
      msg += " -> "+trace.subst.toString();
    }

    msg += " -- "
    switch(trace.status) {
      case "BEFORE":
        msg += "Matching goal";
        break;
      case "REWRITING_HEAD":
        msg += "Rewriting goal";
        break;
      case "SUBST":
        msg += "Subsituting";
        break;
      case "REWRITING_BODY":
        msg += "Rewriting body";
        break;
      case "NEW_GOAL":
        if (trace.goal.toString().length > 0) {
          msg += "New goal";
        } else {
          msg += "Found a solution";
        }
        break;
      case "SUCCESS":
        msg += "Unification Succeeded";
        break;
      case "FAILURE":
        msg += "Unification Failed";
        break;
      default:
    }

    if (cm && msg) {
      var msgEl = document.createElement("div");
      msgEl.className = "errorMsg";
      msgEl.appendChild(document.createTextNode(msg));

      this.lineWidget = cm.addLineWidget(line, msgEl, {coverGutter: false, noHScroll: true});
    } else {
      // console.log("code mirror not available");
    }
  },

  onEditorTextChange: function(e) {
    this.highlight();

    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.timeout = setTimeout(function() {
      EditorActionCreators.changeText(e.target.value);
    }, 500);
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
      // width: "100%",
    };

    return (
      <div className={classes} >
        <CodeMirror className="cm" ref="codeMirror" {...props}/>
      </div>
      );
    }
});

module.exports = Input;
