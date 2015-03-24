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
    program: EditorStore.getProgram()
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

    var L = newState.L;
    if (L) {
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
    }


    // var p = newState.program;
    //
    // if (p) {
    //   console.log(p.solve().next());
    // }

    this.setState(newState);

  },

  propTypes: {
    // value: React.PropTypes.string.isRequired,
  },

  componentDidUpdate: function() {
    if (this.state.highlightedNode) {
      this.highlight(this.state.highlightedNode.interval, 'highlightRule');
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
