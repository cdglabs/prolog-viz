var React = require('react');
var Classable = require('../../mixins/classable.js');
var mui = require('material-ui');
var Toggle = mui.Toggle;
var Goal = require('./Goal.jsx');

var assign = require('object-assign');

var CodeMirror = require('react-code-mirror');
require('codemirror/addon/display/placeholder.js');

var EditorStore = require('../../stores/EditorStore.js');
var EditorActionCreators = require('../../actions/EditorActionCreators.js');

function objToString (obj) {
  var pairs = [];
  for (var p in obj) {
    if (obj.hasOwnProperty(p)) {
      pairs.push(p + ' = ' + obj[p]);
    }
  }
  return pairs.join(', ');
}

function getStateFromStores() {
  return {
    text : EditorStore.getText(),
    rootEnv : EditorStore.getRootEnv(),
    traceIter : EditorStore.getTraceIter(),
    showOnlyCompatible: EditorStore.getShowOnlyCompatible(),
  };
}

var Visualization = React.createClass({
  mixins: [Classable],

  getInitialState: function() {
    return assign(getStateFromStores(), {
      inputs: [],
      showFailure: false,
      showOnlyCompatible: false
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

  onShowCompatibleNameChange: function(e, on) {
    EditorActionCreators.setShowCompatible(on);
  },

  render: function() {

    var showOnlyCompatible = this.state.showOnlyCompatible;

    var vis = <h1>A tree goes here</h1>;

    if (this.state.traceIter) {
      var trace = this.state.traceIter.getCurrentTrace();
      if (trace) {
        var self = this;

        // render the tree using root env
        var rootEnv = trace.rootEnv;

        // use this to target the current node
        var currentEnv = trace.currentEnv;

        vis = (function walkEnv(env, options) {
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

            var longestSiblingGoal = env.children.reduce(function(acc, e) {
              var longestGoal = e.goals.reduce(function(acc, goal) {
                return acc.length > goal.toString().length ? acc : goal.toString();
              }, "");
              return acc.length > longestGoal.length ? acc : longestGoal;
            }, "");
            var longestSiblingSubst = env.children.reduce(function(acc, e) {
              return acc.length > objToString(e.subst).length ? acc : objToString(e.subst);
            }, "");

            // console.log(longestSiblingGoal);
            // console.log(longestSiblingSubst);

            var children = env.children.map(function(childEnv, i) {
              // console.log(env)
              // console.log(env.trace ? env.trace.status : "");
              return walkEnv(childEnv, {
                isDirectlyInsideCurrentEnv: env.envId === currentEnv.envId,
                indexUnderParentEnv: i,
                numberOfChildrenOfParentEnv: env.children.length,
                doesParentEnvCurrentRuleHasBody: trace.currentRule && trace.currentRule.body.length > 0,
                isParentEnvStatusNewGoal: trace.status === "NEW_GOAL",
                longestSiblingGoal: longestSiblingGoal,
                longestSiblingSubst: longestSiblingSubst
              });
            });
          }

          var shouldHighlightLatestGoals = (options && options.isDirectlyInsideCurrentEnv && options.isParentEnvStatusNewGoal && options.indexUnderParentEnv === options.numberOfChildrenOfParentEnv-1)

          var goalProps = assign({
            parent: self,
            env: env,
            children: children,
            shouldAnimate: true,
            failedChildRules: failedChildRules,
            showOnlyCompatible: showOnlyCompatible,
            shouldHighlightLatestGoals: shouldHighlightLatestGoals,
          }, options);

          // if ((options && options.isDirectlyInsideCurrentEnv)) {
          //   console.log("here");
          // }

          // the latest goals in the next env should be highlighted if

                                                  // derve that it will be the next current env
          if (env.envId === currentEnv.envId) {
            goalProps.trace = trace;
          }

          // add key
          return <Goal key={env.envId} {...goalProps} />;
        })(rootEnv, {});

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
        </div>
      </div>
      );
    }
});

module.exports = Visualization;
