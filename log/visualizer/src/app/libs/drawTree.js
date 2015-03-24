// Big thanks to https://github.com/nicolashery/example-d3-react/blob/master/src/d3Chart.js

var d3 = require('d3');

var ns = {};
var width;
var height;
var margin = {
  top: 20,
  right: 300,
  bottom: 20,
  left: 300
};

ns.create = function(el, env) {

  width = getTreeHeight(env) * 180 + 300;
  height = getTreeWidth(env) * 75 ;

  if (width < 600)
    width = 600;
  if (height < 300)
    height = 300;

  var elNode = d3.select(el);
  elNode.selectAll("*").remove();

  var svg = elNode.append('svg')
    .attr('class', 'd3')
    .attr('width', width)
    .attr('height', height);

  var tree = svg.append('g')
    .attr('class', 'd3-tree')
    .attr('width', width + margin.right + margin.left)
    .attr('height', height + margin.top + margin.bottom)
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  svg.append('g')
    .attr('class', 'd3-tooltips');

  this.update(el, env);
};


ns._drawTree = function(el, root) {
  console.log(root);

  var svg = d3.select(el).select('.d3-tree');
  var diagonal = d3.svg.diagonal()
    .projection(function(d) {
      return [d.y, d.x];
    });

  var tree = d3.layout.tree().size([height, width]);
  var nodes = tree.nodes(root).reverse();
  var links = tree.links(nodes);

  nodes.forEach(function(d) {
    d.y = d.depth * 140;
  });

  var link = svg.selectAll(".link").data(links);
  // link.remove();
  link.enter().append("path")
    .attr("class", "link")
    .attr("d", diagonal);
    // link.exit().remove();

  var node = svg.selectAll(".node").data(nodes);
  // node.remove();


  node.enter().append("g")
    .attr("class", "node")
    .attr("transform", function(d) {
      return "translate(" + d.y + "," + d.x + ")";
    });

    // node.exit().remove();

  // adding tooltips
  var tooltip = d3.select(".feedback-tree")
    .append("div")
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("padding", "5px 10px")
    .style("position", "fixed")
    .style("z-index", "10")
    .style("visibility", "hidden")
    .style("border-color", "black")
    .style("border-style", "solid")
    .style("border-width", "1px");

  var circleRadius = 15;

  node.append("text")
    .attr("dx", function(d) {
      return (d.children && d.children.length !== 0) ? -circleRadius*1.5 : circleRadius*1.5;
    })
    .attr("dy", ".35em")
    .style("text-anchor", function(d) {
      return (d.children && d.children.length !== 0) ? "end" : "start";
    })
    .text(function(d) {
      return "solve: "+JSON.stringify(d.goals);
    });


  node.append("circle")
    .attr("r", circleRadius)
    .attr("class", "circle")
    .style("fill", function(d) {
      if (Array.isArray(d.goals) && d.goals.length === 0) {
        return "Lime";
      } else if (Array.isArray(d.goals) && d.goals.length === 1 && d.goals[0] === "nothing") {
        return "Gainsboro";
      }
      else {
        return "Yellow";
      }
    })

    .on("mouseover", function(d) {
      return tooltip
        .style("visibility", "visible")
        .html("<p>goals: " + escapeHtml(JSON.stringify(d.goals, null, '\t')) + "</p>" +
              "<p>subst: " + escapeHtml(JSON.stringify(d.subst, null, '\t')) + "</p>" +
              "<p>rules: " + escapeHtml(JSON.stringify(d.rules, null, '\t')) + "</p>" +
              "<p>solution: " + escapeHtml(d.solution) + "</p>"
               );
          })
    .on("mousemove", function() {
      return tooltip.style("top", (event.clientY - 50) + "px")
        .style("left", (event.clientX + 10) + "px");
    })
    .on("mouseout", function() {
      return tooltip.style("visibility", "hidden");
    });


};

ns.update = function(el, env) {
  this._drawTree(el, env);
};

function escapeHtml(unsafe) {
  if (!unsafe) {
    return  "";
  }
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// DFS to find height
function getTreeHeight(tree) {
  function aux(treeNode, depth) {
    var child;
    var maxDepth = depth;
    var childMaxDepth = 0;
    var index = 0;
    if (!("children" in treeNode))
      return maxDepth;
    for (index = 0; index < treeNode.children.length; index++) {
      child = treeNode.children[index];
      childMaxDepth = aux(child, depth + 1);
      if (childMaxDepth > maxDepth) {
        maxDepth = childMaxDepth;
      }
    }
    return maxDepth;
  }
  return aux(tree, 1);
}

// BFS to find width
function getTreeWidth(tree) {
  function aux(treeNodes) {
    var children = [];
    var index = 0;
    for (index = 0; index < treeNodes.length; index++) {
      var node = treeNodes[index];
      if ("children" in node) {
        var childidx = 0;
        for (childidx = 0; childidx < node.children.length; childidx++) {
          children.push(node.children[childidx]);
        }
      }
    }
    var maxwidth;
    if (children.length > 0) {
      maxwidth = aux(children);
      if (maxwidth < children.length)
        maxwidth = children.length;
      return maxwidth;
    }
    return 1;
  };
  var children = [tree];
  return aux(children);
}

module.exports = ns;
