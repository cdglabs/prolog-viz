var mui = require('material-ui');
var Toggle = mui.Toggle;
var Slider = mui.Slider;
var FlatButton = mui.FlatButton;
var React = require('react');
var Classable = require('../../mixins/classable.js');
var IconButton = mui.IconButton;
var ForwardIcon = require('../components/ForwardIcon.jsx');
var BackwardIcon = require('../components/BackwardIcon.jsx');
var assign = require('object-assign');

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

  onAutoplayChange: function(e, on) {
    var count = 0;
    if (on) {
      this.interval = setInterval(() => {
        var step = 0;
        var maxStep = 0;
        var traceIter = this.state.traceIter;
        if (traceIter) {
          step = traceIter.getStep();
          maxStep = traceIter.getMax();
        }
        if (step === maxStep) {
          count++;
          if (count > 10) {
            EditorActionCreators.setStep(0);
          }
        } else {
          this.forward();
          count = 0;
        }
      }, 1000);
    } else {
      if (this.interval) {
        clearInterval(this.interval);
      }
    }
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

    var forward = <IconButton className="right" onTouchTap={this.forward}>
            <ForwardIcon/>
            </IconButton>;

    var back = <IconButton className="left" onTouchTap={this.backward}>
            <BackwardIcon/>
            </IconButton>;

    return (
      <div className={classes}>
        <div className="toggle">
          <Toggle name="toggleName1" value="toggleValue1" label="Autoplay" defaultToggled={this.state.onAutoplayChange} onToggle={this.onAutoplayChange}/>
          <Toggle name="toggleName2" value="toggleValue2" label="Hide rules with incompatible name" defaultToggled={this.state.showOnlyCompatible} onToggle={this.onShowCompatibleNameChange}/>
        </div>

        <div className="slider">
          <Slider name="slider1" {...sliderProps}/>
        </div>
        <div className="buttons">
          {back}<p className="mid">Step {step+1} of {maxStep+1}</p>{forward}
        </div>
      </div>
      );
    }
});

module.exports = Control;
