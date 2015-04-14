var AppDispatcher = require('../dispatcher/AppDispatcher');
var Constants = require('../constants/Constants');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');
var ohm = require('../libs/ohm.min.js');
var PrologInterpreter = require('../libs/prolog/prolog.js');
var EditorActionCreators = require('../actions/EditorActionCreators.js');

var ActionTypes = Constants.ActionTypes;

var CHANGE_EVENT = 'change';

var DEFAULT_TEXT = "father(orville, abe).\nfather(abe, homer).\nfather(homer, bart).\nfather(homer, lisa).\nfather(homer, maggie).\ngrandfather(X, Y) :- father(X, Z), father(Z, Y).\ngrandfather(X, Y)?";


// HTML5 storage API
var SOURCE_KEY = "prologVisualizer__";
var storageAvailable = typeof(Storage) !== "undefined";

// TODO: setters should be private to file scope
var store = function() {
  var g; // grammar
  var text = DEFAULT_TEXT; // code
  var L; // interpreter
  var program; // result of toAST
  var iter;
  var traceIter;

  var showOnlyCompatible = false;

  if(storageAvailable && localStorage.getItem(SOURCE_KEY)) {
    text = localStorage.getItem(SOURCE_KEY);
  }

  var syntaxError;
  var matchTrace;

  return {
    getText: function() {
      return text || "";
    },
    setText: function(value) {
      text = value;
      if (storageAvailable) {
        localStorage.setItem(SOURCE_KEY, value);
      }
      this.updateProgram();
    },

    getInterpreter: function() {
      return L;
    },

    getShowOnlyCompatible: function() {
      return showOnlyCompatible;
    },
    setShowOnlyCompatible: function(on) {
      showOnlyCompatible = on;
      this.updateProgram();
    },

    getGrammar: function(namespace, domId, grammar) {
      if (!g) {
        try {
          g = ohm.namespace(namespace)
            .loadGrammarsFromScriptElement(document.getElementById(domId))
            .grammar(grammar);
          L = PrologInterpreter(g);
        } catch (err) {
          g = undefined;
          console.log(err);
        }
      }
      this.updateProgram();
      return g;
    },
    updateProgram: function() {
      if (g) {
        try {
          program = L.parse(text);
          var TIME_LIMIT = 150;
          iter = program.solve(showOnlyCompatible, TIME_LIMIT);
          var startTime = Date.now();
          while (iter.next() /*&& count < 5*/ && Date.now() - startTime < TIME_LIMIT  ) {
          }
          traceIter = iter.getTraceIter();
          syntaxError = undefined;
          // matchTrace = L.grammar.matchContents(text, 'tokens');
          this.emitChange();
        } catch (e) {
          if (e instanceof ohm.error.MatchFailure) {
            syntaxError = e;
          } else {
            syntaxError = undefined;
            throw e;
          }
        }
      }
    },
    getProgram: function() {
      return program;
    },
    getSyntaxError: function() {
      return syntaxError;
    },
    getMatchTrace: function() {
      return matchTrace;
    },

    getTraceIter: function() {
      return traceIter;
    },
    stepForward: function() {
      if (traceIter) {
        traceIter.forward();
      } else {
        console.log("traceIter is undefined");
      }
    },
    stepBackward: function() {
      if (traceIter) {
        traceIter.backward();
      } else {
        console.log("traceIter is undefined");
      }
    },
    setStep: function(step) {
      if (traceIter.getStep !== step) {
        traceIter.setStep(step);
        return true;
      }
    }
  };
};

var EditorStore = assign({}, EventEmitter.prototype, {

  emitChange: function() {
    setTimeout(() => {
        if (!AppDispatcher.isDispatching()) {
          this.emit(CHANGE_EVENT);
        } else {
          this.emitChange();
        }
    }, 3);
  },

  /**
   * @param {function} callback
   */
  addChangeListener: function(callback) {
    this.on(CHANGE_EVENT, callback);
  },

  removeChangeListener: function(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  },

}, store());

EditorStore.dispatchToken = AppDispatcher.register(function(payload) {
  var action = payload.action;
  switch (action.type) {
    case ActionTypes.DID_MOUNT:
      if (!g) {
        var g = EditorStore.getGrammar('demo', 'arithmetic', 'L');
        EditorStore.emitChange();
      }
      break;

    case ActionTypes.CHANGE_TEXT:
      EditorStore.setText(action.value);
      EditorStore.emitChange();
      break;

    case ActionTypes.STEP_FORWARD:
      EditorStore.stepForward();
      EditorStore.emitChange();
      break;

    case ActionTypes.STEP_BACKWARD:
      EditorStore.stepBackward();
      EditorStore.emitChange();
      break;

    case ActionTypes.SET_STEP:
      if (EditorStore.setStep(action.value)) {
        EditorStore.emitChange();
      }
      break;

    case ActionTypes.SET_SHOW_COMPATIBLE:
      EditorStore.setShowOnlyCompatible(action.value);
      EditorStore.emitChange();
      break;

    default:
      console.log("No implementation for action: "+action.type);
      break;
  }
});

module.exports = EditorStore;
