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
      pairs.push(p + ' = ' + obj[p]);
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

    // props
    var parent = this.props.parent;
    var env = this.props.node;
    var childNodes = this.props.children;
    var trace = this.props.trace;
    var failedChildRules = this.props.failedChildRules;

    // class related
    var isCurrentEnv = false;
    var isSolution = false;
    var unificationSucceeded = false;
    var unificationFailed = false;
    var anyHighlight = false;
    var nothing = false;


    // === rule labels ===
    // use this to display information inside the current node
    // renamed rule, rewritten goal
    var lineWidget;
    if (trace) {
      isCurrentEnv = true;

      switch(trace.status) {
        case "BEFORE":
          break;
        case "SUCCESS":
        case "SUBST":
        case "NEW_GOAL":
          unificationSucceeded = true;
          break;
        case "FAILURE":
          unificationFailed = true;
          break;
        default:
      }

      if (trace.subst) {
        var message = "Subsituting: "+trace.subst.toString();
        var lineWidgetClasses = cx({
          'errorMsg': true,
        });
        lineWidget = <div className={lineWidgetClasses}>{message}</div>;
      }
    }

    var ruleLabels = <div className="ruleLabels">{env.rules.map(function(rule, i) {

      var highlight = false;
      var lineWidgetPlaceholder;
      if (trace && trace.currentRule && rule === trace.currentRule.toString()) {
        highlight = true;
        lineWidgetPlaceholder = lineWidget;
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
      return <div className="labelChild"><div className={ruleLabelClasses}>{rule.toString()}{lineWidgetPlaceholder}</div>{childNodes[i]}</div>;

    })}</div>;


    var currentGoalLabelClasses = cx({
      'currentGoal': true,
      'highlight': anyHighlight,
      'unificationSucceeded': unificationSucceeded,
      'unificationFailed': unificationFailed,
    });

    // === label ===
    // goals
    var goals = <div className="goals">
                            <div className={currentGoalLabelClasses}>{env.goals.length > 0 ? env.goals[0].toString() : ""}</div>
                            <div>{env.goals.slice(1).toString()}</div>
                        </div>;

    // solution
    if (env.goals.length === 0 && env.solution) {
      goals = env.solution.toString();
      isSolution = true;
    }

    // failed
    if (Array.isArray(env.goals) && env.goals.length === 1 && env.goals[0] === "nothing") {
      nothing = true;
    }

    // subst
    var subst;
    if (!isSolution && !nothing) {
      subst = <div className="subst">{objToString(env.subst)}</div>;
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
        {goals}{subst}
      </div>;

    // === rule ===
    var ruleClasses = cx({
      'rule': true,
      'nothing': nothing,
      'currentEnv': isCurrentEnv
    });
    var ruleProps = {
      env: env,
    };

    return <div key={env.envId} style={style} className={ruleClasses} {...ruleProps}>{label}{ruleLabels}</div>;
  }
});

module.exports = Rule;
