var React = require('react');
var LeafNode = require('./leafNode.jsx');
var Classable = require('../../../mixins/classable.js');
var assign = require('object-assign');

var UnaryOp = React.createClass({
  mixins: [Classable],

  propTypes: {
    start: React.PropTypes.number.isRequired,
    end: React.PropTypes.number.isRequired,
    operand: React.PropTypes.element.isRequired,
    lOp: React.PropTypes.string.isRequired,
    rOp: React.PropTypes.string.isRequired,
  },

  nodeAtCursorPos: function(pos) {
    var cursorNode = this.refs[pos];
    if (!cursorNode) {

      // console.log(this.props.operand.getDOMNode());
      cursorNode = this.props.operand.nodeAtCursorPos(pos);
    }
    return cursorNode;
  },

  render: function() {
    var classes = this.getClasses('minus', {
      // 'editor': true,
    });

    var opStart = this.props.start;
    var lOpNodes = Array.prototype.map.call(this.props.lOp, function(s, i) {
      return <LeafNode ref={opStart+i} start={opStart+i} end={opStart+i+1} content={s}/>;
    }, this);


    opStart = this.props.operand.props.end;
    var rOpNodes = Array.prototype.map.call(this.props.rOp, function(s, i) {
      return <LeafNode ref={opStart+i} start={opStart+i} end={opStart+i+1} content={s}/>;
    }, this);

    return (
      <div className={classes}>
        {lOpNodes}
        {this.props.operand}
        {rOpNodes}
      </div>
      );
    }
});

module.exports = UnaryOp;
