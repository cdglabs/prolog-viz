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

function isEnvNothing(env) {
  if (Array.isArray(env.goals) && env.goals.length === 1 && env.goals[0] === "nothing") {
    return true;
  }
  return false;
}

var Rule = React.createClass({
  mixins: [Classable, tweenState.Mixin],

  getInitialState: function() {
    return {width: 0};
  },

  propTypes: {
    parent: React.PropTypes.object.isRequired,
    env: React.PropTypes.object.isRequired,
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
    var env = this.props.env;
    var childNodes = this.props.children;
    var trace = this.props.trace;
    var failedChildRules = this.props.failedChildRules;
    var shouldHighlightLatestGoals = this.props.shouldHighlightLatestGoals;

    // class related
    var isCurrentEnv = false;
    var isSolution = env.goals.length === 0;
    var unificationSucceeded = false;
    var unificationFailed = false;
    var anyHighlight = false;
    var nothing = isEnvNothing(env);

    var shouldHideRuleBody = true;

    // === rule labels ===
    // use this to display information inside the current node
    // renamed rule, rewritten goal
    var lineWidget;
    if (trace) {
      isCurrentEnv = true;

      switch(trace.status) {
        case "BEFORE":
          break;
        case "SUBST":
        case "SUCCESS":
          shouldHideRuleBody = false;
          unificationSucceeded = true;
          break;
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

    var ruleLabels;
    if (!isSolution) {
      ruleLabels = <div className="ruleLabels">{env.rules.map(function(rule, i) {
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

        var shouldShowEclipseInPlaceOfRuleBody = false;
        if (childNodes.length <= i) {
          shouldShowEclipseInPlaceOfRuleBody = true;
        } else {
          var childEnv = childNodes[i].props.env;
          if (childEnv) {
            if (Array.isArray(childEnv.goals) && childEnv.goals.length === 1 && childEnv.goals[0] === "nothing") {
              shouldShowEclipseInPlaceOfRuleBody = true;
            } else {
              shouldShowEclipseInPlaceOfRuleBody = false;
            }
          }
        }

        var ruleString = rule.toString();
        if (shouldHideRuleBody || !highlight) {
          ruleString = ruleString.replace(/:-.*/, shouldShowEclipseInPlaceOfRuleBody ? ":- ..." : ":- ");
        }
        return <div className="childRuleAndChildGoal"><div className={ruleLabelClasses}>{ruleString}{lineWidgetPlaceholder}</div>{childNodes[i]}</div>;

      })}</div>;
    }



    var currentGoalLabelClasses = cx({
      'currentGoal': true,
      'highlight': anyHighlight || unificationSucceeded,
      'unificationSucceeded': unificationSucceeded,
      'unificationFailed': unificationFailed,
    });
    var latestGoalsLabelClasses = cx({
      'latestGoals': true,
      'highlight': shouldHighlightLatestGoals,
    });

    // === label ===
    // goals
    var numLatestGoals = env.options && env.options.latestGoals ? env.options.latestGoals.length : 1;

    var currentGoal = env.goals.length > 0 ? env.goals[0].toString() : "";

    var goals = <div className="goals">
                  <div className={latestGoalsLabelClasses}>
                    {env.goals.slice(0, numLatestGoals).map(function(goal, i, goals) {
                      if (i !== goals.length -1) {
                        goal+=", ";
                      }
                      if (i === 0) {
                        return <div className={currentGoalLabelClasses}>{goal}</div>;
                      }
                      return <div className="notFirstGoal">{goal}</div>;
                    })}
                  </div>
                  {env.goals.slice(numLatestGoals).map(function(goal, i, goals) {
                    if (i !== goals.length -1) {
                      goal+=", ";
                    }
                    if (numLatestGoals === 0 && i === 0) {
                      return <div className={currentGoalLabelClasses}>{goal}</div>;
                    }
                    return <div className="notFirstGoal">{goal}</div>;
                  })}
                </div>;

    // solution
    if (isSolution) {
      goals = objToString(env.subst);
      if (env.solution) {
        goals = env.solution.toString();
      }
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
