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
      // syntaxHighlight(this.state.matchTrace);
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

    if (!trace) { return; }

    var currentRule = trace.currentEnv.getCurRule();
    var interval = currentRule ? currentRule.interval : undefined;
    if (interval) {
      var startPos = cm.posFromIndex(interval.startIdx),
          endPos = cm.posFromIndex(interval.endIdx);
      cm.markText(startPos, endPos, { className: className });
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
    };

    return (
      <div className={classes} >
        <CodeMirror className="cm" ref="codeMirror" {...props}/>
      </div>
      );
    }
});

module.exports = Input;
