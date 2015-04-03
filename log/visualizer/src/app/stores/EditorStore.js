var AppDispatcher = require('../dispatcher/AppDispatcher');
var Constants = require('../constants/Constants');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');
var ohm = require('../libs/ohm.min.js');
var PrologInterpreter = require('../libs/prolog.js');
var EditorActionCreators = require('../actions/EditorActionCreators.js');

var ActionTypes = Constants.ActionTypes;

var CHANGE_EVENT = 'change';

var DEFAULT_TEXT = "father(orville, abe).\nfather(abe, homer).\nfather(homer, bart).\nfather(homer, lisa).\nfather(homer, maggie).\nparent(X, Y) :- father(X, Y).\ngrandfather(X, Y) :- father(X, Z), parent(Z, Y).\ngrandfather(X, Y)?";

// Misc Helpers
// ------------
String.prototype.splice = function(idx, rem, s) {
  return (this.slice(0, idx) + s + this.slice(idx + Math.abs(rem)));
};

function clone(obj) {
  var result = {};
  for (var k in obj) {
    if (obj.hasOwnProperty(k))
      result[k] = obj[k];
  }
  return result;
}

// HTML5 storage API
var SOURCE_KEY = "prolog_input";
var ARGS_SOURCE_KEY = "prolog_args";
var storageAvailable = typeof(Storage) !== "undefined";

// detect mobile browser
var IS_MOBILE = typeof navigator === 'undefined' || (
  navigator.userAgent.match(/Android/i)
    || navigator.userAgent.match(/webOS/i)
    || navigator.userAgent.match(/iPhone/i)
    || navigator.userAgent.match(/iPad/i)
    || navigator.userAgent.match(/iPod/i)
    || navigator.userAgent.match(/BlackBerry/i)
    || navigator.userAgent.match(/Windows Phone/i)
);

// TODO: setters should be private to file scope
var store = function() {
  var g; // grammar
  var text = DEFAULT_TEXT; // code
  var L; // interpreter
  var program; // result of toAST
  var iter;
  var traceIter;

  var showOnlyCompatible = false;

  if(storageAvailable) {
    if (localStorage.getItem(SOURCE_KEY)) {
      text = localStorage.getItem(SOURCE_KEY);
    }
  }
  var highlightedNode;
  var highlightedTopLevelNode;

  var cursorIndex;

  var trace;

  var syntaxError;
  var syntaxHighlight;
  var matchTrace;

  return {
    getIsMobile: function() {
      return IS_MOBILE;
    },

    getText: function() {
      return text ? text : "";
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
          syntaxHighlight = L.grammar && L.grammar.semanticAction({
            number: function(_) {
              cm.doc.markText(
                cm.doc.posFromIndex(this.interval.startIdx),
                cm.doc.posFromIndex(this.interval.endIdx),
                { className: "number" }
              );
            },
            ident: function(_, _) {
              cm.doc.markText(
                cm.doc.posFromIndex(this.interval.startIdx),
                cm.doc.posFromIndex(this.interval.endIdx),
                { className: "ident" }
              );
            },
            keyword: function(_) {
              cm.doc.markText(
                cm.doc.posFromIndex(this.interval.startIdx),
                cm.doc.posFromIndex(this.interval.endIdx),
                { className: "keyword" }
              );
            },
            variable: function(_, _) {
              cm.doc.markText(
                cm.doc.posFromIndex(this.interval.startIdx),
                cm.doc.posFromIndex(this.interval.endIdx),
                { className: "variable" }
              );
            },
            symbol: function(_, _) {
              cm.doc.markText(
                cm.doc.posFromIndex(this.interval.startIdx),
                cm.doc.posFromIndex(this.interval.endIdx),
                { className: "symbol" }
              );
            },
            comment: function(_) {
              cm.doc.markText(
                cm.doc.posFromIndex(this.interval.startIdx),
                cm.doc.posFromIndex(this.interval.endIdx),
                { className: "comment" }
              );
            },
            _list: ohm.actions.map,
            _terminal: function() {},
            _default: ohm.actions.passThrough
          });
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
          iter = program.solve(showOnlyCompatible);
          var count = 0;
          while (iter.next() && count < 5) {
            count++;
          }
          traceIter = iter.getTraceIter();
          syntaxError = undefined;
          matchTrace = L.grammar.matchContents(text, 'tokens');
          EditorStore.emitChange();
        } catch (e) {
          // console.log("error updating the program");
          // console.log(e);
          if (e instanceof ohm.error.MatchFailure) {
            // showSyntaxError(e, src);
            syntaxError = e;
          } else {
            // clearEverythingElse();
            // abs.setValue(showException(e));
            syntaxError = undefined;
          }
        }
      }
    },
    getProgram: function() {
      return program;
    },
    getSyntaxHighlight: function() {
      return syntaxHighlight;
    },
    getSyntaxError: function() {
      return syntaxError;
    },
    getMatchTrace: function() {
      return matchTrace;
    },
    getIter: function() {
      return iter;
    },
    getRootEnv: function() {
      var ret;
      if (iter) {
        ret = iter.getRootEnv();
      }
      return ret;
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
      traceIter.setStep(step);
    }
  };
};

var EditorStore = assign({}, EventEmitter.prototype, store(), {

  emitChange: function() {
    this.emit(CHANGE_EVENT);
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

});

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
      EditorStore.setStep(action.value);
      EditorStore.emitChange();
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
