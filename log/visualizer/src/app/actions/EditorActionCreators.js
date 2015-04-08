var AppDispatcher = require('../dispatcher/AppDispatcher');
var Constants = require('../constants/Constants');

var ActionTypes = Constants.ActionTypes;

module.exports = {

  didMount: function() {
    AppDispatcher.handleViewAction({
      type: ActionTypes.DID_MOUNT,
    });
  },

  changeText: function(value) {
    AppDispatcher.handleViewAction({
      type: ActionTypes.CHANGE_TEXT,
      value: value
    });
  },

  stepForward: function() {
    AppDispatcher.handleViewAction({
      type: ActionTypes.STEP_FORWARD,
    });
  },

  stepBackward: function() {
    AppDispatcher.handleViewAction({
      type: ActionTypes.STEP_BACKWARD,
    });
  },
  setStep: function(value) {
    AppDispatcher.handleViewAction({
      type: ActionTypes.SET_STEP,
      value: value
    });
  },


  setShowCompatible: function(value) {
    AppDispatcher.handleViewAction({
      type: ActionTypes.SET_SHOW_COMPATIBLE,
      value: value
    });
  },


};
