var React = require('react');
var BinaryOp = require('./BinaryOp.jsx');
var Classable = require('../../../mixins/classable.js');
var assign = require('object-assign');

var Divide = React.createClass({
  mixins: [Classable],

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
    var classes = this.getClasses('divide', {
      // 'editor': true,
    });

    var props = assign({
      op: this.props.content
    }, this.props);

    return (
      <BinaryOp ref="op" className={classes} {...props}/>
      );
    }
});

module.exports = Divide;
