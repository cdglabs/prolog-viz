var AppDispatcher = require('../dispatcher/AppDispatcher');
var Constants = require('../constants/Constants');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');
var request = require('superagent');

var ActionTypes = Constants.ActionTypes;

var CHANGE_EVENT = 'change-examples';

var examples = [
  {
    name: 'alice and bob are people',
    code: 'person(alice).\n' +
          'person(bob).\n' +
          'person(X)?',
  },
  {
    name: 'sick and tired',
    code: 'sick(joe).\n' +
          'sick(frank).\n' +
          'sick(eddie).\n' +
          'tired(joe).\n' +
          'tired(eddie).\n' +
          'sick(X), tired(X)?',
  },
  {
    name: "prereqs",
    code: 'prereq(cs131, cs137a).\n' +
          'prereq(cs137a, cs137b).\n' +
          'prereqTrans(X, Y) :- prereq(X, Y).\n' +
          'prereqTrans(X, Y) :- prereq(X, Z), prereqTrans(Z, Y).\n' +
          'prereqTrans(P, cs137b)?',
  },
  {
    name: 'nats',
    code: 'nat(z).\n' +
          'nat(s(X)) :- nat(X).\n' +
          'nat(X)?',
  },
  {
    name: 'evens',
    code: 'nat(z).\n' +
          'nat(s(X)) :- nat(X).\n' +
          'even(z).\n' +
          'even(s(s(X))) :- even(X).\n' +
          'even(X)?',
  },
  {
    name: 'plus (1/3)',
    code: 'plus(z, X, X).\n' +
          'plus(s(X), Y, s(Z)) :- plus(X, Y, Z).\n' +
          'plus(s(z), s(s(z)), X)?\n',
  },
  {
    name: 'plus (2/3)',
    code: 'plus(z, X, X).\n' +
          'plus(s(X), Y, s(Z)) :- plus(X, Y, Z).\n' +
          'plus(X, s(s(z)), s(s(s(z))))?\n',
  },
  {
    name: 'plus (3/3)',
    code: 'plus(z, X, X).\n' +
          'plus(s(X), Y, s(Z)) :- plus(X, Y, Z).\n' +
          'plus(s(z), X, s(s(s(z))))?\n',
  },
  {
    name: 'cons and car',
    code: 'car(cons(X, Y), X).\n' +
          'car(cons(a, nil), X)?',
  },
  {
    name: 'length',
    code: 'length(nil, z).\n' +
          'length(cons(X, L), s(LL)) :- length(L, LL).\n' +
          'length(cons(a, cons(b, cons(c, nil))), X)?',
  },
  {
    name: "homer's children",
    code: 'father(homer, bart).\n' +
          'father(homer, lisa).\n' +
          'father(homer, maggie).\n' +
          'parent(X, Y) :- father(X, Y).\n' +
          'parent(homer, Y)?',
  },
  {
    name: "lisa's father",
    code: 'father(homer, bart).\n' +
          'father(homer, lisa).\n' +
          'father(homer, maggie).\n' +
          'parent(X, Y) :- father(X, Y).\n' +
          'parent(X, lisa)?',
  },
  {
    name: "parent",
    code: 'father(abe, homer).\n' +
          'father(homer, bart).\n' +
          'father(homer, lisa).\n' +
          'father(homer, maggie).\n' +
          'parent(X, Y) :- father(X, Y).\n' +
          'parent(X, Y)?',
  },
  {
    name: "grandfather",
    code: 'father(orville, abe).\n' +
          'father(abe, homer).\n' +
          'father(homer, bart).\n' +
          'father(homer, lisa).\n' +
          'father(homer, maggie).\n' +
          'grandfather(X, Y) :- father(X, Z), father(Z, Y).\n' +
          'grandfather(X, Y)?',
  },
  {
    name: 'nats infinite loop',
    code: 'nat(s(X)) :- nat(X).\n' +
          'nat(z).\n' +
          'nat(X)?',
  },
  {
    name: 'infinite loop',
    code: 'p(X):-q(X).\n' +
          'q(X):-p(X).\n' +
          'q(X)?',
  },
];

var store = function() {
  return {
    getExamples: function() {
      return examples;
    },

    loadExamplesFromURL: function(url) {
      request
      .get(url)
      .end(function(err, res){
        // Calling the end function will send the request
        if (!err) {
          var newExamples = JSON.parse(res.text);
          if (Array.isArray(newExamples)) {
            examples = newExamples;
            ExamplesStore.emitChange();
          }
        }
      });
    }
  };
};

var ExamplesStore = assign({}, EventEmitter.prototype, store(), {

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

ExamplesStore.dispatchToken = AppDispatcher.register(function(payload) {
  var action = payload.action;
  switch (action.type) {
    case ActionTypes.DID_MOUNT:
      // load json from the web
      // https://raw.githubusercontent.com/cdglabs/prolog/master/resources/examples.json
      ExamplesStore.loadExamplesFromURL("https://cdn.rawgit.com/cdglabs/prolog/master/resources/examples.json");
      break;

    default:
      // console.log("No implementation for action: "+action.type);
      break;
  }
});

module.exports = ExamplesStore;
