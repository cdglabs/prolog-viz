function IndentingOutputStream() {
  this.baseCols = [0];
  this.lines = [[]];
}

IndentingOutputStream.prototype.indentSpaces = 2;

IndentingOutputStream.prototype._currLine = function() {
  return this.lines[this.lines.length - 1];
};

IndentingOutputStream.prototype.baseCol = function() {
  return this.baseCols[this.baseCols.length - 1];
};

IndentingOutputStream.prototype.indent = function() {
  this.baseCols.push(this.baseCol() + this.indentSpaces);
};

IndentingOutputStream.prototype.indentToHere = function() {
  var currLineLength = this._currLine().join('').length;
  this.baseCols.push(currLineLength);
};

IndentingOutputStream.prototype.indentFromHere = function() {
  var currLineLength = this._currLine().join('').length;
  this.baseCols.push(currLineLength + this.indentSpaces);
};

IndentingOutputStream.prototype.dedent = function() {
  this.baseCols.pop();
};

IndentingOutputStream.prototype.nl = function() {
  var newLine = [];
  for (var idx = 0; idx < this.baseCol(); idx++) {
    newLine.push(' ');
  }
  this.lines.push(newLine);
};

IndentingOutputStream.prototype.write = function(str) {
  this._currLine().push(str);
};

IndentingOutputStream.prototype.contents = function() {
  var lines = this.lines.map(function(line) { return line.join(''); });
  return lines.join('\n');
};

