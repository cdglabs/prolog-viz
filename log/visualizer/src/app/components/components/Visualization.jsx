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
    // scroll to curren rule
    // .ruleLabel.highlight
    // .currentGoal.highlight
    this.showBookmark(".currentEnv", false);
  },

  showNode: function (oNode) {
    var nLeft = 0, nTop = 0;
    var node = this.refs.vis.getDOMNode();

    for (var oItNode = oNode; oItNode && oItNode !== node; nLeft += oItNode.offsetLeft, nTop += oItNode.offsetTop, oItNode = oItNode.offsetParent);
    node.scrollTop = nTop;
    node.scrollLeft = nLeft;

    console.log(nLeft);

    // highlight the node
    // oNode.classList.add("highlightRule");
    // this.lastHighlightedNode = oNode;
  },

  showBookmark: function(sBookmark, bUseHash) {
    if (arguments.length === 1 || bUseHash) {
        location.hash = sBookmark;
        return;
    }
    var oBookmark = this.getDOMNode().querySelector(sBookmark);
    // var oBookmark = document.getElementById(sBookmark);
    if (oBookmark) {
        // special treatment for <td/>
        // if (oBookmark.parentNode.tagName === "TD") {
        //   oBookmark = oBookmark.parentNode;
        // }
        this.showNode(oBookmark);
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

          var failedChildRules = env.children.map(function(child) {
            var ret = false;

            if (child && Array.isArray(child.goals) && child.goals.length === 1 && child.goals[0] === "nothing") {
              ret = true;
            }

            return ret;
          });

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
            failedChildRules: failedChildRules,
          };

          if (env.envId === currentEnv.envId) {
            ruleProps.trace = trace;
          }

          // add key
          return <Rule key={env.envId} {...ruleProps} />;
        })(rootEnv);

      }
    }

    var classes = this.getClasses('visualization', {
      // "prin": true
    });

    return (
      <div className="visualization">{/*TODO: no longer needed*/}
        <div ref="vis" className="content">
          {vis}
        </div>
        <div className="controls">
          <Toggle name="toggleName1" value="toggleValue1" label="Show failed nodes" onToggle={this.onShowFailureChange}/>
          <Toggle name="toggleName1" value="toggleValue1" label="Show only rules with compatible name" onToggle={this.onShowFailureChange}/>
        </div>
      </div>
      );
    }
});

module.exports = Visualization;
