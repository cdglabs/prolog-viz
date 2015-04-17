var React = require('react');
var BinaryOp = require('./BinaryOp.jsx');
var Classable = require('../../../mixins/classable.js');
var assign = require('object-assign');

var Multiply = React.createClass({
  propTypes: {
    start: React.PropTypes.number.isRequired,
    end: React.PropTypes.number.isRequired,
    lhs: React.PropTypes.element.isRequired,
    rhs: React.PropTypes.element.isRequired,
    content: React.PropTypes.string.isRequired,
  },

  nodeAtCursorPos: function(pos) {
    return this.refs.op.nodeAtCursorPos(pos);
  },

  render: function() {
    var classes = this.getClasses('multiply', {
      // 'editor': true,
    });

    var props = assign({
      op: this.props.content//'\u00D7'
    }, this.props);

    return (
      <BinaryOp className={classes} {...props}/>
      );
    }
});

module.exports = Multiply;
