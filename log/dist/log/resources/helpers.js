function prettyPrintJS(code) {
  if (typeof code === "string") {
    return js_beautify(code);
  } else {
    throw new Error("expected a string, but got " + code + " instead");
  }
} 

function arrayEquals(xs, ys) {
  if (!(xs instanceof Array && ys instanceof Array) || xs.length !== ys.length) {
    return false;
  } else {
    for (var idx = 0; idx < xs.length; idx++) {
      if (!(__equals__(xs[idx], ys[idx]))) {
        return false;
      }
    }
    return true;
  }
}

function __equals__(x, y) {
  return x instanceof Array ? arrayEquals(x, y) : x === y;
}

var equals = __equals__;

function toDOM(x) {
  if (x instanceof Node) {
    return x;
  } else if (x instanceof Array) {
    var xNode = document.createElement(x[0]);
    x.slice(1).
      map(function(y) { return toDOM(y); }).
      forEach(function(yNode) { xNode.appendChild(yNode); });
    return xNode;
  } else {
    return document.createTextNode(x);
  }
}

// TODO: make this cross-browser
function load(url) {
  var req = new XMLHttpRequest();
  req.open('GET', url, false);
  try {
    req.send();
    if (req.status === 0 || req.status === 200) {
      return req.responseText;
    }
  } catch (e) {}
  throw new Error('unable to load url ' + url);
}

function loadScript(url) {
  var src = load(url);
  jQuery.globalEval(src);
}

