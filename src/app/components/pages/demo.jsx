var React = require('react');
var Router = require('react-router');
var assign = require('object-assign');

var Input = require('../components/Input.jsx');
var Control = require('../components/Control.jsx');
var Examples = require('../components/Examples.jsx');
var Visualization = require('../components/Visualization.jsx');

var EditorStore = require('../../stores/EditorStore.js');

function getStateFromStores() {
  return {
  };
}

var Demo = React.createClass({
  mixins: [Router.State, Router.Navigation],

  getInitialState: function() {
    return getStateFromStores();
  },

  componentDidMount: function() {
    EditorStore.addChangeListener(this._onChange);
  },

  componentWillUnmount: function() {
    EditorStore.removeChangeListener(this._onChange);
  },

  /**
   * Event handler for 'change' events coming from the stores
   */
  _onChange: function() {
    this.setState(getStateFromStores());
  },

  render: function() {
    return (
      <div className="demo-page">
        <div className="leftPanel">
          <Input/>
          <Control/>
          <Examples/>
        </div>
        <div className="rightPanel">
          <Visualization/>
        </div>
      </div>
    );
  }

});

module.exports = Demo;
