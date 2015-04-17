function Trace(rootEnv) {
  this.rootEnv = rootEnv;
  this.currentEnv = rootEnv;
  this.depth = 0;
  this.traces = [];
}

Trace.prototype.log = function(message) {
  this.traces.push({
    rootEnv: this.rootEnv.clone(),
    currentEnv: this.currentEnv.clone(),
    message: message
  });
};

Trace.prototype.logLastFrame = function() {
  this.traces.push({
    rootEnv: this.rootEnv.clone(),
    currentEnv: undefined,
  });
};

Trace.prototype.setCurrentEnv = function(currentEnv) {
  this.currentEnv = currentEnv;
};

Trace.prototype.getIterator = function() {
  var idx = 0;
  return {
    forward: function() {
      idx = Math.min(this.getMax(), idx+1)
    },
    backward: function() {
      idx = Math.max(0, idx-1);
    },
    setStep: function(step) {
      if (step === undefined) {
        return;
      }
      idx = Math.floor(Math.max(Math.min(step, this.getMax()), 0));
    },
    // in the following arrow functions, this refers Trace
    getCurrentTrace: () => this.traces[idx],
    getMax: () => this.traces.length-1,
    getStep: () => idx,
  };
};

module.exports = Trace;
