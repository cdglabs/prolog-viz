var React = require('react');
var LeafNode = require('./leafNode.jsx');
var Classable = require('../../../mixins/classable.js');
var assign = require('object-assign');

var BinaryOp = React.createClass({
  mixins: [Classable],

  propTypes: {
    start: React.PropTypes.number.isRequired,
    end: React.PropTypes.number.isRequired,
    lhs: React.PropTypes.element.isRequired,
    rhs: React.PropTypes.element.isRequired,
    op: React.PropTypes.string.isRequired,
  },

  nodeAtCursorPos: function(pos) {
    var cursorNode = this.refs[pos];
    if (!cursorNode) {
      cursorNode = this.props.lhs.nodeAtCursorPos(pos);
    }
    if (!cursorNode) {
      cursorNode = this.props.rhs.nodeAtCursorPos(pos);
    }

    return cursorNode;
  },

  render: function() {
    var classes = this.getClasses('minus', {
      // 'editor': true,
    });


    var substring = this.props.op.substring(this.props.lhs.props.end-this.props.lhs.props.start, this.props.rhs.props.start-this.props.lhs.props.start);

    var opStart = this.props.lhs.props.end;
    var opNodes = Array.prototype.map.call(substring, function(s, i) {
      return <LeafNode ref={opStart+i} start={opStart+i} end={opStart+i+1} content={s}/>;
    });

    return (
      <div className={classes}>
        {this.props.lhs}
        {opNodes}
        {this.props.rhs}
      </div>
      );
    }
});

module.exports = BinaryOp;
