var React = require('react');
var Classable = require('../../mixins/classable.js');

var assign = require('object-assign');

var Tree = require('./D3Tree.jsx');
var CodeMirror = require('react-code-mirror');
require('codemirror/addon/display/placeholder.js');

var EditorStore = require('../../stores/EditorStore.js');
var EditorActionCreators = require('../../actions/EditorActionCreators.js');

function getStateFromStores() {
  return {
    text : EditorStore.getText(),
    rootEnv : EditorStore.getRootEnv(),
    traceIter : EditorStore.getTraceIter(),
  };
}

var Visualization = React.createClass({
  mixins: [Classable],

  getInitialState: function() {
    return assign(getStateFromStores(), {
      inputs: []
    });
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
    this.setState(getStateFromStores());
  },

  propTypes: {
    // value: React.PropTypes.string.isRequired,
  },

  componentDidUpdate: function() {
    if (this.state.argsErrorMsg !== undefined) {
      // this.highlight(this.state.argsErrorMsg);
    }
  },

  onEditorTextChange: function(e) {
    EditorActionCreators.changeArgsText(e.target.value);
  },

  render: function() {
    var classes = this.getClasses('visualization', {
      // "prin": true
    });

    var args = this.state.args;
    var text = this.state.text;

    // console.log(JSON.stringify(args));

    var preview = "Preview not available.";
    var results = "Results not available.";
    var numArgsString = "";// "("+args.length+"/"+formatNodes.length+")";

    if (args && text) {
      var argsString = this.state.argsText.length === 0 ? "" : ", "+this.state.argsText;
      preview = "printf(\""+text+"\""+argsString+");";

      try {
        results = eval(preview);
      } catch(e) {
        console.log(e);
        results = e.toString();
      }
    }

    var props = {
      lineWrapping: true,
      viewportMargin: Infinity,
      // lineNumbers: true,
      onChange: this.onEditorTextChange,
      defaultValue: this.state.argsText,
      placeholder: "Insert arguments here..."
    };


    var tree = <h1>A tree goes here</h1>;

    if (this.state.traceIter) {
      var rootEnv = this.state.traceIter.getEnv();
      var currentEnv = this.state.traceIter.getCurrentEnv();
      if (rootEnv) {
        var treeProps = {
          data: rootEnv,
          currentEnv: currentEnv
        };
        tree = <Tree {...treeProps}/>;
      }
    }

    return (
      <div className="visualizationScrollWrapper">{/*TODO: no longer needed*/}
        <div className={classes}>
          {tree}
        </div>
      </div>

      );
    }
});

module.exports = Visualization;
