var React = require('react');
var LeafNode = require('./leafNode.jsx');
var Classable = require('../../../mixins/classable.js');
var assign = require('object-assign');

var Num = React.createClass({
  mixins: [Classable],

  propTypes: {
    start: React.PropTypes.number.isRequired,
    end: React.PropTypes.number.isRequired,
    content: React.PropTypes.string.isRequired,
  },

  componentDidMount: function() {
    if (this.props.content.length !== this.props.end - this.props.start) {
      throw new Error("content length does not match start and end");
    }
  },

  nodeAtCursorPos: function(pos) {
    var cursorNode = this.refs[pos];
    if (!cursorNode) {
      throw new Error("cursor pos invalid");
    }
    return cursorNode;
  },

  componentWillUnmount: function() {
  },

  render: function() {
    var classes = this.getClasses('number', {
      // 'editor': true,
    });

    var content = Array.prototype.map.call(this.props.content, function(s, i) {
      return <LeafNode ref={this.props.start+i} start={this.props.start+i} end={this.props.start+i+1} content={s}/>;
    }.bind(this));

    return (
      <div className={classes}>{content}</div>
      );
    }
});

module.exports = Num;
