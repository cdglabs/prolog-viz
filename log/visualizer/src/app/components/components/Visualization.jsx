var React = require('react');
var Classable = require('../../mixins/classable.js');
var mui = require('material-ui');
var Toggle = mui.Toggle;
var Rule = require('./Rule.jsx');

var assign = require('object-assign');

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
      inputs: [],
      showFailure: false
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

  onShowFailureChange: function(e, on) {
    this.setState({
      showFailure: on
    });
  },

  render: function() {
    var classes = this.getClasses('visualization', {
      // "prin": true
    });

    var vis = <h1>A tree goes here</h1>;

    if (this.state.traceIter) {
      var trace = this.state.traceIter.getCurrentTrace();
      if (trace) {
        var self = this;

        // render the tree using root env
        var rootEnv = trace.rootEnv;

        // use this to target the current node
        var currentEnv = trace.currentEnv;

        vis = (function walkEnv(env) {
          if (!env) {
            return;
          }

          if (env.children) {
            var children = env.children.map(function(child) {
              return walkEnv(child);
            });
          }

          var ruleProps = {
            parent: self,
            node: env,
            children: children,
            shouldAnimate: true,
          };

          if (env.envId === currentEnv.envId) {
            // console.log(currentEnv);

            ruleProps.trace = trace;
          }

          // add key
          return <Rule key={env.envId} {...ruleProps} />;
        })(rootEnv);

      }
    }

    return (
      <div className="visualizationScrollWrapper">{/*TODO: no longer needed*/}
        <div className={classes}>
          {vis}
        </div>
        <div className="controls">
          <Toggle name="toggleName1" value="toggleValue1" label="Show failed nodes" onToggle={this.onShowFailureChange}/>
        </div>
      </div>
      );
    }
});

module.exports = Visualization;
