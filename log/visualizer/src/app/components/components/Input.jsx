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
            this.highlight(trace, 'highlightRuleBefore');
            break;
          case "SUCCESS":
            this.highlight(trace, 'highlightRuleSuccess');
            break;
          case "FAILURE":
            this.highlight(trace, 'highlightRuleFailure');
            break;
          default:
            this.highlight(undefined, 'highlightRule');
        }
      } else {
        this.highlight(undefined, 'highlightRule');
      }
    }
  },

  highlight: function(trace, className) {
    var cm = this.refs.codeMirror.editor;
    cm.getAllMarks().forEach(function(m) { m.clear(); });

    var interval = trace && trace.currentRule ? trace.currentRule.interval : undefined;

    if (cm && interval) {
      var startPos = cm.posFromIndex(interval.startIdx),
          endPos = cm.posFromIndex(interval.endIdx);
      cm.markText(startPos, endPos, { className: className });

      this.highlightWidget(trace, endPos.line);
    } else {
      this.highlightWidget();

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
    if (trace.goal) {
      msg += trace.goal.toString();
    }
    if (trace.subst) {
      msg += " -> "+trace.subst.toString();
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
    EditorActionCreators.changeText(e.target.value);
  },

  render: function() {
    var classes = this.getClasses('input', {
    });

    var props = {
      lineWrapping: true,
      viewportMargin: Infinity,
      lineNumbers: true,
      onChange: this.onEditorTextChange,
      defaultValue: this.state.text,
    };

    return (
      <div className={classes} >
        <div className="mid"><CodeMirror ref="codeMirror" {...props}/></div>
      </div>
      );
    }
});

module.exports = Input;
