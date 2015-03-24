var React = require('react');
var assign = require('object-assign');

var Editor = require('./Editor.jsx');

var Plus = require('./TwoDee/Plus.jsx');
var Minus = require('./TwoDee/Minus.jsx');
var Multiply = require('./TwoDee/Multiply.jsx');
var Divide = require('./TwoDee/Minus.jsx');
var Power = require('./TwoDee/Power.jsx');
var Paren = require('./TwoDee/Paren.jsx');
var Num = require('./TwoDee/Number.jsx');

var BinaryOp = require('./TwoDee/BinaryOp.jsx');
var UnaryOp = require('./TwoDee/UnaryOp.jsx');


var Classable = require('../../mixins/classable.js');
var EditorStore = require('../../stores/EditorStore.js');
var EditorActionCreators = require('../../actions/EditorActionCreators.js');

function getStateFromStores() {
  return {
    grammar: EditorStore.getGrammar(),
    text : EditorStore.getText(),
    cursorPos : EditorStore.getCursorPos(),
  };
}

var TwoDeeEditor = React.createClass({
  mixins: [Classable],

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
    EditorActionCreators.didMount();
  },

  componentWillUnmount: function() {
    EditorStore.removeChangeListener(this._onChange);
  },

  /**
   * Event handler for 'change' events coming from the stores
   */
  _onChange: function() {
    this.setState(getStateFromStores(), function() {
      // var text = this.state.text;
      // var pos = this.state.cursorPos;
      // console.log(text.splice(pos, 0, '|'));
      // this.updateCursorPosition();
    }.bind(this));
  },

  componentDidUpdate: function() {
    this.updateCursorPosition();
  },

  updateCursorPosition: function() {
    // console.log(this.refs);
    // console.log( this.refs.tree2);
    // console.log( this.refs.tree2.props.children);
    return
    console.log( this.refs.tree2);

    var cursorNode = this.refs.tree2;
    if (cursorNode) {
      console.log(JSON.stringify([cursorNode.props.start, cursorNode.props.end]));
      console.log(cursorNode.nodeAtCursorPos);
      var rectNode = cursorNode.nodeAtCursorPos(this.state.cursorPos);
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
      // console.log("no cursor node");
    }

    // var cursorNode = this.refs[this.state.cursorPos];
    // if (cursorNode) {
    //   // console.log(JSON.stringify([cursorNode.props.start, cursorNode.props.end]));
    //
    //   var rectNode = cursorNode.getDOMNode();
    //   var rect = rectNode.getBoundingClientRect();
    //   // console.log(rect);
    //   var editorRect = this.refs.editor.getDOMNode().getBoundingClientRect();
    //
    //   this.setState({
    //     cursorRect: {
    //       left: rect.left - editorRect.left + this.getDOMNode().scrollLeft - 1,
    //       top: rect.top - editorRect.top + this.getDOMNode().scrollTop,
    //       height: rect.height
    //     }
    //   });
    // } else {
    //   // console.log("no cursor node");
    // }
  },


  render: function() {
    var value = '';
    var oops = false;
    var props = { value: '0',
              cursorRect: this.state.cursorRect,
            };
    var tree = [];
    var tree2 = [];

    if (this.state.grammar) {
      tree = [];
      var text = this.state.text;

      var constants = {pi: Math.PI, e: Math.E};
      var interpret = {
        Expr:           function(expr)           { return expr.value; },
        AddExpr:        function(expr)           { return expr.value; },
        AddExpr_plus:   function(x, op, y)       { return x.value + y.value; },
        AddExpr_minus:  function(x, op, y)       { return x.value - y.value; },
        MulExpr:        function(expr)           { return expr.value; },
        MulExpr_times:  function(x, op, y)       { return x.value * y.value; },
        MulExpr_divide: function(x, op, y)       { return x.value / y.value; },
        ExpExpr:        function(expr)           { return expr.value; },
        ExpExpr_power:  function(x, op, y)       { return Math.pow(x.value, y.value); },
        PriExpr:        function(expr)           { return expr.value; },
        PriExpr_paren:  function(open, e, close) { return e.value; },
        ident:          function()               { return constants[this.interval.contents]; },
        number:         function()               { return parseFloat(this.interval.contents); }
      };

      var _render2 = {
        Expr: function(expr) {
          var props = {
            start: this.interval.startIdx,
            end: this.interval.endIdx,
            operand: expr.value,
            open: "",
            close: ""
          };

          return <Paren ref="tree2" {...props}/>;

          // return expr.value;
        },
        AddExpr: function(expr) {
          return expr.value;
        },
        AddExpr_plus: function(x, op, y) {
          var props = {
            start: this.interval.startIdx,
            end: this.interval.endIdx,
            content: this.interval.contents,
            lhs: x.value,
            rhs: y.value
          };
          return <Plus {...props}/>;
        },
        AddExpr_minus: function(x, op, y) {
          var props = {
            start: this.interval.startIdx,
            end: this.interval.endIdx,
            content: this.interval.contents,
            lhs: x.value,
            rhs: y.value
          };
          return <Minus {...props}/>;
        },
        MulExpr: function(expr) {
          return expr.value;
        },
        MulExpr_times: function(x, op, y) {
          var props = {
            start: this.interval.startIdx,
            end: this.interval.endIdx,
            content: this.interval.contents,
            lhs: x.value,
            rhs: y.value
          };
          return <Multiply {...props}/>;
        },
        MulExpr_divide: function(x, op, y) {
          var props = {
            start: this.interval.startIdx,
            end: this.interval.endIdx,
            content: this.interval.contents,
            lhs: x.value,
            rhs: y.value
          };
          return <Divide {...props}/>;
        },
        ExpExpr: function(expr) {
          return expr.value;
        },
        ExpExpr_power: function(x, op, y) {
          var props = {
            start: this.interval.startIdx,
            end: this.interval.endIdx,
            content: this.interval.contents,
            lhs: x.value,
            rhs: y.value
          };
          return <Power {...props}/>;
        },
        PriExpr: function(expr) {
          return expr.value;
        },
        PriExpr_paren: function(open, e, close) {
          var props = {
            start: this.interval.startIdx,
            end: this.interval.endIdx,
            operand: e.value,
            open: open.interval.contents,
            close: close.interval.contents
          };

          return <Paren {...props}/>;
        },
        ident: function() {
          var props = {
            start: this.interval.startIdx,
            end: this.interval.endIdx,
            content: this.interval.contents
          };

          return <Num {...props}/>;
          // return constants[this.interval.contents];
        },
        number: function() {
          var props = {
            start: this.interval.startIdx,
            end: this.interval.endIdx,
            content: this.interval.contents
          };
          // console.log(JSON.stringify(props));
          return <Num {...props}/>;
        }
      };


      var _render = {
        _default: function(ruleName, args) {
          for (var idx = 0; idx < args.length; idx++) {
            args[idx].value;
          }
          // console.log("rulename: "+ruleName+" args: "+JSON.stringify(args));
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


            if (overlappingNodes.length === 1 && overlappingNodes[0].props.start === start && overlappingNodes[0].props.end === end ) {

            } else {
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

              // console.log("ruleName: "+ruleName+" content: "+text.substring(start, end));
              var newNode = <div className={ruleName} start={start} end={end}>{content}</div>;

              tree.splice(minIndex, maxIndex-minIndex+1, newNode);
            }
          }
        }
      };

      var thunk = this.state.grammar.matchContents(text, 'Expr');
      if (thunk) {
        oops = false;
        this.getDOMNode().setAttribute('value', ' = ' + thunk(interpret));
        thunk(_render);
        tree2 = thunk(_render2);
        tree.push(<div className="leafNode" ref={text.length} start={text.length} end={text.length+1}> </div>);
      } else {
        if (text.length > 0) {
          oops = true;
          tree.push(<div >{text}</div>);
        }
        props.value = '';
      }
    }

    var classes = this.getClasses('twoDee', {
      // 'tree': true,
    });

    // tree2.ref = "tree2";
    // tree2.key = "tree2";
    // console.log(tree2);

    return (
      <Editor ref="editor" {...props} className={classes}>
        {tree2}
      </Editor>
      );
  }
});

module.exports = TwoDeeEditor;
