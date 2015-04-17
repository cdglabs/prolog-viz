var React = require('react');
var UnaryOp = require('./UnaryOp.jsx');
var Classable = require('../../../mixins/classable.js');
var assign = require('object-assign');

var Paren = React.createClass({
  mixins: [Classable],

  propTypes: {
    start: React.PropTypes.number.isRequired,
    end: React.PropTypes.number.isRequired,
    operand: React.PropTypes.element.isRequired,
    open: React.PropTypes.string.isRequired,
    close:  React.PropTypes.string.isRequired,
  },

  nodeAtCursorPos: function(pos) {
    return this.refs.op.nodeAtCursorPos(pos);
  },

  render: function() {
    var classes = this.getClasses('plus', {
      // 'editor': true,
    });

    var props = assign({
      lOp: this.props.open, // 0 ... operand.start
      rOp: this.props.close
    }, this.props);

    return (
      <UnaryOp ref="op" className={classes} {...props}/>
      );
    }
});

module.exports = Paren;
