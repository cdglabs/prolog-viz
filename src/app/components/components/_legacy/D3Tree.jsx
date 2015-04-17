var React = require('react');
var d3Tree = require('../../libs/drawTree.js');

var FeedbackTree = React.createClass({
  propTypes: {
    data: React.PropTypes.object,
  },

  componentDidMount: function() {
    var el = this.getDOMNode();
    d3Tree.create(el, this.props);
  },

  componentDidUpdate: function() {
    var el = this.getDOMNode();
    if (this.props) {
      d3Tree.create(el, this.props);

      // d3Tree.update(el, this.props.data);
    }
  },

  componentWillUnmount: function() {
    var el = this.getDOMNode();
    d3Tree.destroy(el);
  },

  render: function() {
    return (
      <div className="feedback-tree"></div>
    );
  }
});


module.exports = FeedbackTree;
