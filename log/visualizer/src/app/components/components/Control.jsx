var mui = require('material-ui');
var Toggle = mui.Toggle;
var Slider = mui.Slider;
var FlatButton = mui.FlatButton;
var React = require('react');
var Classable = require('../../mixins/classable.js');

var assign = require('object-assign');

var CodeMirror = require('react-code-mirror');
require('codemirror/addon/display/placeholder.js');

var EditorStore = require('../../stores/EditorStore.js');
var EditorActionCreators = require('../../actions/EditorActionCreators.js');

function getStateFromStores() {
  return {
    text : EditorStore.getText(),
    traceIter : EditorStore.getTraceIter(),
    showOnlyCompatible: EditorStore.getShowOnlyCompatible(),
  };
}

var Control = React.createClass({
  mixins: [Classable],

  getInitialState: function() {
    return assign(getStateFromStores(), {
      inputs: []
    });
  },

  componentDidMount: function() {
    EditorStore.addChangeListener(this._onChange);
    // this.refs.codeMirror.editor.on('cursorActivity', this.handleCursorActivity);
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

  propTypes: {
    // value: React.PropTypes.string.isRequired,
  },

  backward: function() {
    EditorActionCreators.stepBackward();
  },

  forward: function() {
    EditorActionCreators.stepForward();
  },

  onSliderChange: function(e, value) {
    EditorActionCreators.setStep(value);
  },

  onSliderStart: function(e, value) {
    this.setState({
      dragging: true
    });
  },

  onSliderEnd: function(e, value) {
    this.setState({
      dragging: false
    });
  },

  onShowCompatibleNameChange: function(e, on) {
    EditorActionCreators.setShowCompatible(on);
  },

  render: function() {
    var classes = this.getClasses('control', {
      // "prin": true
    });

    var step = 0;
    var maxStep = 0;
    var traceIter = this.state.traceIter;
    if (traceIter) {
      step = traceIter.getStep();
      maxStep = traceIter.getMax();
    }

    var sliderProps = {
      max: maxStep,
      min: 0,
      step: 1,
      onChange: this.onSliderChange,
      onDragStart: this.onSliderStart,
      onDragStop: this.onSliderEnd
    };

    if (!this.state.dragging) {
      sliderProps.value = step;
    }

    return (
      <div className={classes}>
        <div className="toggle">
          <Toggle name="toggleName1" value="toggleValue1" label="Show only rules with compatible name" defaultToggled={this.state.showOnlyCompatible} onToggle={this.onShowCompatibleNameChange}/>
        </div>

        <div className="slider">
          <Slider name="slider1" {...sliderProps}/>
        </div>
        <div className="buttons">
          <FlatButton className="left" label="Back" onTouchTap={this.backward}/>
          <p className="mid">Step {step+1} of {maxStep+1}</p>
          <FlatButton className="right" label="Forward" onTouchTap={this.forward}/>
        </div>
      </div>
      );
    }
});

module.exports = Control;
