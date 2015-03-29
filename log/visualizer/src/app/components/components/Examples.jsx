var React = require('react');
var Classable = require('../../mixins/classable.js');
var assign = require('object-assign');
var Router = require('react-router');
var Link = Router.Link;
var urlencode = require('urlencode');

var ExamplesStore = require('../../stores/ExamplesStore.js');
// var ExamplesActionCreators = require('../../actions/ExamplesActionCreators.js');

function getStateFromStores() {
  return {
    examples : ExamplesStore.getExamples(),
  };
}

var Examples = React.createClass({
  mixins: [Classable],

  getInitialState: function() {
    return getStateFromStores();
  },

  componentDidMount: function() {
    ExamplesStore.addChangeListener(this._onChange);
  },

  componentWillUnmount: function() {
    ExamplesStore.removeChangeListener(this._onChange);
  },

  /**
   * Event handler for 'change' events coming from the stores
   */
  _onChange: function() {
    this.setState(getStateFromStores());
  },

  propTypes: {
    // value: React.PropTypes.string.isRequired,
  },

  render: function() {
    var classes = this.getClasses('examples', {
    });

    var rows = this.state.examples.map(function(example) {
      return <div className="example">
              <Link to="examples" params={{exampelName: urlencode.encode(example.name)}}>{example.name}</Link>
            </div>;
    })

    return (
      <div className={classes} >
        <h3 className="title">Examples</h3>
        {rows}
      </div>
      );
    }
});

module.exports = Examples;
