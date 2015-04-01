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

var Goal = React.createClass({
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
    var showOnlyCompatible = this.props.showOnlyCompatible;

    var longestSiblingGoal = this.props.longestSiblingGoal;
    var longestSiblingSubst = this.props.longestSiblingSubst;

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
          shouldHideRuleBody = true;
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
          'lineWidget': true,
        });
        lineWidget = <div className={lineWidgetClasses}>{message}</div>;
      }
    }

    var shouldHighlights = env.rules.map(function(rule, i) {
      return trace && trace.currentRule && rule === trace.currentRule.toString();
    });
    anyHighlight = shouldHighlights.some(function(shouldHighlight) {
      return shouldHighlight === true;
    });

    var ruleStrings = env.rules.map(function(rule, i) {
      if (showOnlyCompatible) {
        if (env.goals[0]) {
          var reg = /\(.*/;
          if (env.goals[0].replace(reg, "") !== rule.replace(reg, "")) {
            return;
          }
        }
      }

      var childEnv;
      if (childNodes[i]) {
        childEnv = childNodes[i].props.env;
      }
      var shouldShowEclipseInPlaceOfRuleBody = false;
      if (childNodes.length <= i) {
        shouldShowEclipseInPlaceOfRuleBody = true;
      } else {
        if (childEnv) {
          if (Array.isArray(childEnv.goals) && childEnv.goals.length === 1 && childEnv.goals[0] === "nothing") {
            shouldShowEclipseInPlaceOfRuleBody = true;
          } else {
            shouldShowEclipseInPlaceOfRuleBody = false;
          }
        }
      }

      var ruleString = rule.toString();
      if (shouldHideRuleBody || !shouldHighlights[i]) {
        ruleString = ruleString.replace(/:-.*/, shouldShowEclipseInPlaceOfRuleBody ? ":- ..." : ":- ");
      }
      return ruleString;
    });
    var longestRule = ruleStrings.reduce(function(acc, e) {
      if (!e) { return acc; }
      return acc.length > e.length ? acc : e;
    }, "");

    var rulesAndChildren = <div className="rulesAndChildren">{ruleStrings.map(function(rule, i) {
      if (!rule) {
        return;
      }

      var lineWidgetPlaceholder;
      if (shouldHighlights[i]) {
        lineWidgetPlaceholder = lineWidget;
      }

      // if a rule leads to failed node, cross it
      var shouldStrike = false;
      if (failedChildRules && failedChildRules[i]) {
        shouldStrike = true;
      }

      var noChild = childNodes[i] === undefined;

      var ruleClasses = cx({
        'rule': true,
        'highlight': shouldHighlights[i],
        'unificationSucceeded': unificationSucceeded,
        'unificationFailed': unificationFailed,
        'shouldStrike': shouldStrike,
        'noChild': noChild
      });

      var duplicatedCurrentGoal = noChild || shouldStrike ? undefined : <div className="duplicatedCurrentGoal">{env.goals[0]}</div>;
      return <div className="ruleAndChild">
              <div className="ruleWrapper">
                <div className="longestRule">{longestRule}</div>
                {duplicatedCurrentGoal}
                <div className={ruleClasses}>
                  {rule}{lineWidgetPlaceholder}
                </div>
              </div>
              {childNodes[i]}
            </div>;
    })}</div>;

    // === labels ===
    // goals
    var goalStrings = env.goals;
    // // solution
    // if (isSolution) {
    //   goalStrings = [objToString(env.subst)];
    //   if (env.solution) {
    //     goalStrings = [env.solution.toString()];
    //   }
    // }

    var numLatestGoals = env.options && env.options.latestGoals ? env.options.latestGoals.length : 0;
    var goals = <div className="goals">
                  {goalStrings.map(function(goal, i, goals) {
                    // if (i !== goals.length -1) {
                    //   goal+=", ";
                    // }

                    var isCurrentGoal = i === 0;
                    var isLatestGoal = i < numLatestGoals;
                    var isFirstNonLatestGoal = numLatestGoals > 0 && i === numLatestGoals;
                    var highlight = false;
                    var highlightLatest = false;
                    if (isCurrentGoal) {
                      highlight = anyHighlight || unificationSucceeded;
                    }
                    if (isLatestGoal) {
                      highlightLatest = shouldHighlightLatestGoals;
                    }

                    var goalLabelClasses = cx({
                      'goalLabel': true,
                      'currentGoal': isCurrentGoal,
                      'latestGoal': isLatestGoal,
                      'firstNonLastestGoal': isFirstNonLatestGoal,
                      'highlight': highlight,
                      'highlightLatest': highlightLatest,
                      'unificationSucceeded': unificationSucceeded,
                      'unificationFailed': unificationFailed,
                    });

                    return <div className={goalLabelClasses}>{goal}</div>;
                  })}
                </div>;


    // subst
    var substString = objToString(env.subst);
    if (env.options && env.options.solution) {
      substString = env.options.solution === "yes" ? "" : env.options.solution;
    }
    var subst = <div className="subst">{substString}</div>;

    // label
    var labelsClasses = cx({
      'labels': true,
    });
    var labelsProps = {
      // onMouseEnter: parent.onMouseOverPExpr.bind(parent, node),
      // onMouseLeave: parent.onMouseOutPExpr,
      // onClick: parent.onClickPExpr.bind(parent, node),
    };
    var labels = <div key={"label"} className={labelsClasses} {...labelsProps}>
        <div className="contents">{goals}{subst}</div>
        <div className="longestPlaceholder">{longestSiblingGoal}</div>
        <div className="longestPlaceholder">{longestSiblingSubst}</div>
      </div>;

    // === goal ===
    var goalClasses = cx({
      'goal': true,
      'nothing': nothing,
      'currentEnv': isCurrentEnv,
      'solution': isSolution,
      'shouldHideRulesAndChildren': shouldHighlightLatestGoals
    });
    var goalProps = {
      env: env,
    };

    return <div key={env.envId} style={style} className={goalClasses} {...goalProps}>{labels}{rulesAndChildren}</div>;
  }
});

module.exports = Goal;
