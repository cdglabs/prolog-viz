var React = require('react');
var Router = require('react-router');
var assign = require('object-assign');
var urlencode = require('urlencode');

var Input = require('../components/Input.jsx');
var Info = require('../components/Info.jsx');
var Control = require('../components/Control.jsx')
var Examples = require('../components/Examples.jsx')
var Visualization = require('../components/Visualization.jsx');

var EditorStore = require('../../stores/EditorStore.js');
var EditorActionCreators = require('../../actions/EditorActionCreators.js');
var ExamplesStore = require('../../stores/ExamplesStore.js');

function getStateFromStores() {
  return {
    // languages: EditorStore.getLanguages(),
    examples : ExamplesStore.getExamples(),
  };
}

var Demo = React.createClass({
  mixins: [Router.State, Router.Navigation],

  getInitialState: function() {
    return getStateFromStores();
  },

  componentDidMount: function() {
    EditorStore.addChangeListener(this._onChange);
    // load grammar from script tag
    EditorActionCreators.didMount();

    var exampleName = urlencode.decode(this.getParams().exampelName);
    if (exampleName) {
      var text;
      this.state.examples.forEach(function(example) {
        if (example.name === exampleName) {
          text = example.code;
        }
      });
      if (text) {
        EditorActionCreators.changeText(text);
      }
    }

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
  //  componentDidUpdate: function() {
  //  },

  // <Info/>

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
