var React = require('react');
var Classable = require('../../mixins/classable.js');
var tweenState = require('react-tween-state');
var ReactTransitionGroup = React.addons.TransitionGroup;
var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;
var cx = React.addons.classSet;

function objToString (obj) {
  var pairs = [];
  for (var p in obj) {
    if (obj.hasOwnProperty(p)) {
      pairs.push(p + ': ' + obj[p]);
    }
  }
  return pairs.join(', ');
}

var Rule = React.createClass({
  mixins: [Classable, tweenState.Mixin],

  getInitialState: function() {
    return {width: 0};
  },

  propTypes: {
    parent: React.PropTypes.object.isRequired,
    node: React.PropTypes.object.isRequired,
    // count: React.PropTypes.number.isRequired,
    shouldAnimate: React.PropTypes.bool.isRequired,
  },

  getDefaultProps: function() {
    return {
      shouldAnimate: false
    };
  },

  componentDidMount: function() {
    this.shouldAnimate = this.props.shouldAnimate;
  },

  // animation
  componentWillEnter: function(done) {
    this.animatedStarted = true;

    if (!this.actualWidth) {
      this.actualWidth = parseFloat(window.getComputedStyle(this.getDOMNode()).width);
    }
    var duration = 250;
    this.tweenState('width', {
      easing: tweenState.easingTypes.easeOutSine,
      duration: duration,
      endValue: this.actualWidth,
    });
    this.lastTimeoutIDEnter = window.setTimeout(function() {
      done();
    }.bind(this), duration*1.5);
  },

  componentWillLeave: function(done) {
    this.animatedStarted = true;

    var targetWidth = 0;
    var duration = 250;
    this.tweenState('width', {
      easing: tweenState.easingTypes.easeOutSine,
      duration: duration,
      endValue: targetWidth,
    });
    this.lastTimeoutIDLeave = window.setTimeout(function() {
      done();
    }.bind(this), duration*1.5);
  },

  // TODO: performance optimization
  // shouldComponentUpdate: function(nextProps, nextState) {}

  render: function() {
    var style = {
    };

    // if ( this.props.shouldAnimate && this.animatedStarted) {
    //   var width = this.getTweeningValue('width');
    //   style.width = width;
    //   // console.log("width: "+style.width +" actualWidth: "+parseFloat(window.getComputedStyle(this.getDOMNode()).width));
    // }

    var parent = this.props.parent;
    var env = this.props.node;
    var childNodes = this.props.children;
    var trace = this.props.trace;
    var failedChildRules = this.props.failedChildRules;

    var isSolution = false;



    var subst = <div className="subst">{objToString(env.subst)}</div>;


    var isCurrentEnv = false;

    var unificationSucceeded = false;
    var unificationFailed = false;
    // use this to display information inside the current node
    // renamed rule, rewritten goal
    if (trace) {
      isCurrentEnv = true;

      var msg = "";
      if (trace.subst) {
        msg += "Subsituting: "+trace.subst.toString();
      }

      switch(trace.status) {
        case "BEFORE":
          break;
        case "SUCCESS":
        case "SUBST":
        case "NEW_GOAL":
          unificationSucceeded = true;
          break;
        case "FAILURE":
          unificationFailed = true
          break;
        default:
      }

    }
    var lineWidgetClasses = cx({
      'errorMsg': true,
    });

    var lineWidget = msg ? <div className={lineWidgetClasses}>{msg}</div> : undefined;


    // rule label
    var rules = env.rules;

    var anyHighlight = false;

    var ruleLabels =
    <div className="ruleLabels">{rules.map(function(rule, i) {

      var highlight = false;
      var lineWidget2;
      if (trace && trace.currentRule && rule === trace.currentRule.toString()) {
        highlight = true;
        lineWidget2 = lineWidget;
      }
      anyHighlight |= highlight;

      // if a rule leads to failed node, cross it
      var shouldCross = false;
      if (failedChildRules && failedChildRules[i]) {
        shouldCross = true;
      }

      var ruleLabelClasses = cx({
        'ruleLabel': true,
        'highlight': highlight,
        'unificationSucceeded': unificationSucceeded,
        'unificationFailed': unificationFailed,
        'shouldCross': shouldCross
      });
      return <div className="labelChild"><div className={ruleLabelClasses}>{rule.toString()}{lineWidget2}</div>{childNodes[i]}</div>;

    })}</div>;


    var currentGoalLabelClasses = cx({
      'currentGoal': true,
      'highlight': anyHighlight,
      'unificationSucceeded': unificationSucceeded,
      'unificationFailed': unificationFailed,
    });

    // goal label
    var displayString = <div className="goals">
                            <div className={currentGoalLabelClasses}>{env.goals.length > 0 ? env.goals[0].toString() : ""}</div>
                            <div>{env.goals.slice(1).toString()}</div>
                        </div>;

    // solution
    if (env.goals.length === 0 && env.solution) {
      displayString = env.solution.toString();
      subst = "";
      isSolution = true;
    }

    // failed
    if (Array.isArray(env.goals) && env.goals.length === 1 && env.goals[0] === "nothing") {
      displayString = "✕";
    }

    // label
    var labelClasses = cx({
      'label': true,
      'solution': isSolution
    });
    var labelProps = {
      // onMouseEnter: parent.onMouseOverPExpr.bind(parent, node),
      // onMouseLeave: parent.onMouseOutPExpr,
      // onClick: parent.onClickPExpr.bind(parent, node),
    };

    var label = <div key={"label"} className={labelClasses} {...labelProps}>
        {displayString}{subst}
      </div>;

    // children
    // var children =
    //   <div key={"children"} className="children">
    //     {<div className="childrenCSSTransitionGroup" component="div">
    //                                       {childNodes}
    //                                     </div>}
    //   </div>;

      // {<ReactTransitionGroup className="childrenCSSTransitionGroup" component="div">
      //                                   {childNodes}
      //                                 </ReactTransitionGroup>}

    // rule
    var nothing = false;
    if (Array.isArray(env.goals) && env.goals.length === 1 && env.goals[0] === "nothing") {
      nothing = true;
    }

    var ruleClasses = cx({
      'rule': true,
      'nothing': nothing,
      'current': isCurrentEnv
    });
    var ruleProps = {
      env: env,
    };

    // {ruleLabel}
    //            {children}

    return <div key={env.envId} style={style} className={ruleClasses} {...ruleProps}>
            {label}
            {ruleLabels}
          </div>;

  }
});

module.exports = Rule;
