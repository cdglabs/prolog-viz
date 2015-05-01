var React = require('react');
var Classable = require('../../mixins/classable.js');
var Goal = require('./Goal.jsx');
var assign = require('object-assign');

var EditorStore = require('../../stores/EditorStore.js');
var EditorActionCreators = require('../../actions/EditorActionCreators.js');

function getStateFromStores() {
  return {
    text : EditorStore.getText(),
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

    var printEl;
    var beforePrint = () => {
      if (printEl) {
        printEl.remove();
      }

      var programEl = document.createElement("div");
      programEl.className = "originalProgram";
      programEl.textContent = this.state.text;

      var treeEl = this.refs.content.getDOMNode().cloneNode(true);

      function recursive_erase_id(node) {
          if (node.removeAttribute) { // Or node.nodeType == Node.ELEMENT_NODE
                                      // Or even node.nodeType == 1 (IE and Opera does not define the NodeType constants!)
              node.removeAttribute('data-reactid');
          }

          var children = node.childNodes;
          for (var i = 0, j = children.length; i < j; i++) {
              recursive_erase_id(children.item(i)); // Depth-first.
          }
      }

      recursive_erase_id(treeEl);

      var printContent = document.createElement("div");
      printContent.className = "printContent";
      printContent.appendChild(programEl);
      printContent.appendChild(treeEl);

      var aspectContent = document.createElement("div");
      aspectContent.className = "aspectContent";
      aspectContent.appendChild(printContent);

      printEl = document.createElement("div");
      printEl.className = "aspectWrapper";
      printEl.appendChild(aspectContent);
      document.body.appendChild(printEl);

      var contentRect = printContent.getBoundingClientRect();
      var wrapperRect = printEl.getBoundingClientRect();

      var scale = 1/Math.max(contentRect.height/wrapperRect.height, contentRect.width/wrapperRect.width);
      printContent.style.transform = "scale("+scale+")";
    };
    var afterPrint = () => {
      if (printEl) {
        printEl.remove();
      }
    };

    if (window.matchMedia) {
        var mediaQueryList = window.matchMedia('print');
        mediaQueryList.addListener(function(mql) {
            if (mql.matches) {
                beforePrint();
            } else {
                afterPrint();
            }
        });
    }

    window.onbeforeprint = beforePrint;
    window.onafterprint = afterPrint;
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

    // select all .duplicatedCurrentGoal , hide if overlapped
    var numBorders = 3;
    var elements = document.getElementsByClassName("duplicatedCurrentGoal");
    if (elements) {
      Array.prototype.forEach.call(elements, function(el) {
        // goal > labels+rulesAndChildren > ruleAndChild > ruleWrapper > duplicatedCurrentGoal
        var labels = el.parentNode.parentNode.parentNode.previousSibling;
        if (!labels) {
          return;
        }
        var labelsRect = labels.getBoundingClientRect();
        var elRect = el.getBoundingClientRect();
        var overlap = !(labelsRect.right < elRect.left ||
                        labelsRect.left > elRect.right ||
                        labelsRect.bottom-numBorders < elRect.top ||
                        labelsRect.top > elRect.bottom);
        if (overlap) {
          el.classList.add("overlapped");

          // el.style.outline = "black solid 1px";
          // labels.style.outline = "black solid 1px";
        }
      });
    }
  },

  showNode: function (oNode) {
    var nLeft = 0, nTop = 0;
    var node = this.refs.content.getDOMNode();

    for (var oItNode = oNode; oItNode && oItNode !== node; nLeft += oItNode.offsetLeft, nTop += oItNode.offsetTop, oItNode = oItNode.offsetParent);
    var margin = 10;
    node.scrollTop = nTop-margin;
    node.scrollLeft = nLeft-margin*10;

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
    // if (oBookmark) {
        // special treatment for <td/>
        // if (oBookmark.parentNode.tagName === "TD") {
        //   oBookmark = oBookmark.parentNode;
        // }
    // }
    this.showNode(oBookmark);

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

    var content = <div className="errorMessage">Apparently, something went wrong :(</div>;

    if (this.state.traceIter) {
      var trace = this.state.traceIter.getCurrentTrace();
      if (trace) {
        var {rootEnv, currentEnv} = trace;
        content = (function walkEnv(env, options) {
          if (!env) {
            return;
          }

          var max = (a, b) => a.length > b.length ? a : b;
          var arrayMax = arr => arr.reduce((a, b) => max(a.toString(), b.toString()), "");

          var children;
          if (env.children) {
            var longestSiblingGoal = arrayMax(env.children
              .filter(childEnv => !childEnv.isEmpty())
              .map(childEnv => arrayMax(childEnv.goals)));
            var longestSiblingSolution = arrayMax(env.children
              .filter(childEnv => !childEnv.isEmpty())
              .map(childEnv => env.options.solution ? env.options.solution.toString() : ""));

            children = env.children.map((childEnv, i) => walkEnv(childEnv, {
                nthChild: i,
                parentEnv: env,
                longestSiblingLabel: max(longestSiblingGoal, longestSiblingSolution),
                depth: options.depth+1
              })
            );
          }

          var parentEnv = options.parentEnv;

          var goalProps = assign({
            visualizationComponent: this,
            env: env,
            children: children,
            shouldAnimate: true,
            hideRulesWithIncompatibleName: showOnlyCompatible,
            shouldHighlightLatestGoals: !!currentEnv && !!parentEnv && parentEnv.getCurRuleIndex() === options.nthChild && parentEnv.envId === currentEnv.envId && trace.message === "3",
            trace: (!!currentEnv && env.envId === currentEnv.envId) ? trace : undefined,
            isLastFrame: !currentEnv,
          }, options);
          return <Goal key={env.envId} {...goalProps} />;
        }).bind(this)(rootEnv, {depth: 0});
      }
    }

    var classes = this.getClasses('visualization', {});
    return (
      <div className={classes}>
        <div ref="content" className="content">
          {content}
        </div>
      </div>
      );
    }
});

module.exports = Visualization;
