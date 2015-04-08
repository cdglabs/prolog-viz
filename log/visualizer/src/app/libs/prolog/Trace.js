function Trace(rootEnv) {
  this.rootEnv = rootEnv;
  this.currentEnv = rootEnv;
  this.traces = [];

  this.record();
}

Trace.prototype.record = function () {
  this.traces.push({
    rootEnv: this.rootEnv.clone(),
    currentEnv: this.currentEnv.clone()
  });
};

module.exports = Trace;
