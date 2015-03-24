var React = require('react');


var Expression = React.createClass({
  propTypes: {
    start: React.PropTypes.number.isRequired,
    end: React.PropTypes.number.isRequired,
    // height: React.PropTypes.number.isRequired,
  },
  getInitialState: function() {
    return {
      visiable: true
    };
  },

  componentDidMount: function() {
  },

  rectForCursorAtIndex: function(idx) {
    var isInInterval = function(start, end, idx) {
      return start <=idx && idx < end;
    };

    if (!isInInterval(this.props.start, this.props.end, idx)) {
      throw new Error("idx out of range: "+" idx: "+idx+" start: "+start+" end: "+end);
    }

    for (var i=0; i<this.props.children.length; i++) {
      var child = this.props.children[i];
      // TODO: assert child is instance of Expression
      if (isInInterval(child.props.start, child.props.end, idx)) {
        return child.rectForCursorAtIndex(idx);
      }
    }

    // isLeafNode

  },

  componentWillUnmount: function() {
  },

  render: function() {
    var classes = this.getClasses('expression', {
      // 'editor': true,
    });

    return (
      <div className={classes}/>
      );
    }
});

module.exports = Expression;
