var React = require('react');
var Classable = require('../../../mixins/classable.js');
var assign = require('object-assign');

var LeafNode = React.createClass({
  mixins: [Classable],

  propTypes: {
    start: React.PropTypes.number.isRequired,
    end: React.PropTypes.number.isRequired,
    content: React.PropTypes.string.isRequired,
  },

  render: function() {
    var classes = this.getClasses('leafNode', {
    });

    return (
      <div className={classes}>{this.props.content}</div>
      );
    }
});

module.exports = LeafNode;
