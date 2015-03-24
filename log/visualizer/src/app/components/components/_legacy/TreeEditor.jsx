var React = require('react');
var assign = require('object-assign');

var Editor = require('./Editor.jsx');

var Classable = require('../../mixins/classable.js');
var EditorStore = require('../../stores/EditorStore.js');
var EditorActionCreators = require('../../actions/EditorActionCreators.js');

var SetIntervalMixin = {
  componentWillMount: function() {
    this.intervals = [];
  },
  setInterval: function() {
    this.intervals.push(setInterval.apply(null, arguments));
  },
  componentWillUnmount: function() {
    this.intervals.map(clearInterval);
  }
};

function getStateFromStores() {
  return {
    grammar: EditorStore.getGrammar(),
    text : EditorStore.getText(),
    cursorPos : EditorStore.getCursorPos(),
  };
}

var TreeEditor = React.createClass({
  mixins: [Classable, SetIntervalMixin],

  getInitialState: function() {
    return assign(getStateFromStores(), {
      cursorRect: {
        left: 10,
        top: 10,
        height: 24,
      }
    });
  },

  componentDidMount: function() {
    EditorStore.addChangeListener(this._onChange);
  },

  componentWillUnmount: function() {
    EditorStore.removeChangeListener(this._onChange);
  },

  /**
   * Event handler for 'change' events coming from the stores
   */
  _onChange: function() {
    this.setState(getStateFromStores(), function() {
      var text = this.state.text;
      var pos = this.state.cursorPos;
      console.log(text.splice(pos, 0, '|'));
      this.updateCursorPosition();
    }.bind(this));

  },

  updateCursorPosition: function() {
    var cursorNode = this.refs[this.state.cursorPos];
    if (cursorNode) {
      // console.log(JSON.stringify([cursorNode.props.start, cursorNode.props.end]));

      var rectNode = cursorNode.getDOMNode();
      var rect = rectNode.getBoundingClientRect();
      // console.log(rect);
      var editorRect = this.refs.editor.getDOMNode().getBoundingClientRect();

      this.setState({
        cursorRect: {
          left: rect.left - editorRect.left + this.getDOMNode().scrollLeft - 1,
          top: rect.top - editorRect.top + this.getDOMNode().scrollTop,
          height: rect.height
        }
      });
    } else {
      console.log("no cursor node");
    }
  },

  render: function() {

    var oops = false;
    var tree = [];
    if (this.state.grammar) {
      tree = [];
      var text = this.state.text;

      var _render = {
        _default: function(ruleName, args) {
          for (var idx = 0; idx < args.length; idx++) {
            args[idx].value;
          }
          if (ruleName.indexOf('_') === -1) {
            var start = this.interval.startIdx;
            var end = this.interval.endIdx;

            var minIndex = tree.length;
            var maxIndex = 0;
            var overlappingNodes = tree.filter(function(node, i) {
              if (end >= node.props.start && start <= node.props.end) {
                minIndex = Math.min(minIndex, i);
                maxIndex = Math.max(maxIndex, i);
                return true;
              }
            }).sort(function(a, b) {
              return a.props.start - b.props.start;
            });

            var content = [];
            var curPos = start;
            for (var i = 0; i < overlappingNodes.length; i++) {
              var node = overlappingNodes[i];
              if (node.props.start > curPos) {
                var subNodeContent = Array.prototype.map.call(text.substring(curPos, node.props.start), function(s, i) {
                  return <div className="leafNode" ref={curPos+i} start={curPos+i} end={curPos+i+1}>{s}</div>;
                });
                content.push(subNodeContent);
              }
              content.push(node);
              curPos = node.props.end;
            }

            if (curPos < end) {
              var subNodeContent = Array.prototype.map.call(text.substring(curPos, end), function(s, i) {
                return <div className="leafNode"  ref={curPos+i} start={curPos+i} end={curPos+i+1}>{s}</div>;
              });

              content.push(subNodeContent);
            }

            var newNode = <div className={ruleName} start={start} end={end}>{content}</div>;

            tree.splice(minIndex, maxIndex-minIndex+1, newNode);
          }
        }
      };

      var thunk = this.state.grammar.matchContents(text, 'Expr');
      if (thunk) {
        thunk(_render);
        oops = false;
        tree.push(<div className="leafNode" ref={text.length} start={text.length} end={text.length+1}> </div>);

      } else if (text.length > 0) {
        oops = true;
        var subNodeContent = Array.prototype.map.call(text, function(s, i) {
          return <div className="leafNode"  ref={i} start={i} end={i+1}>{s}</div>;
        });

        tree.push(subNodeContent);
      }


    }


    var classes = this.getClasses('tree', {
      'oops': oops,
    });

    var props = {
            cursorRect: this.state.cursorRect
            };
    return (
      <Editor ref="editor" className={classes} {...props}>
        {tree}
      </Editor>
      );
  }
});

module.exports = TreeEditor;
