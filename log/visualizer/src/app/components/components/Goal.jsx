var React = require('react');
var Classable = require('../../mixins/classable.js');
var tweenState = require('react-tween-state');
var ReactTransitionGroup = React.addons.TransitionGroup;
var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;
var cx = React.addons.classSet;

var Goal = React.createClass({
  mixins: [Classable, tweenState.Mixin],

  getInitialState: function() {
    return {width: 0};
  },

  propTypes: {
    parent: React.PropTypes.object.isRequired,
    env: React.PropTypes.object.isRequired,
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
    var shouldHighlightLatestGoals = this.props.shouldHighlightLatestGoals;
    var showOnlyCompatible = this.props.showOnlyCompatible;

    var longestSiblingLabel = this.props.longestSiblingLabel;

    var isCurrentEnv = !!trace;

    if (env.hasSolution()) {
      // TODO
      // return only subst
      // return <div></div>;
    }
    if (env.isEmpty()) {
      return <div></div>;
    }

    // === rule labels ===

    // TODO: show only compatible
    var ruleStrings = env.rules.map((rule) => (rule.toString()+" ").replace(/:-.*/, rule.hasSucceeded() ? ":- " : ":- ...") );
    var rewrittenRuleStrings = env.rules.map((rule) => rule.rewritten ? (rule.rewritten.toString()+" ").replace(/:-.*/, rule.hasSucceeded() ? ":- " : ":- ...") : "");
    var substStrings = env.rules.map((rule) => rule.substituting ? "substituting: "+rule.substituting.toString() : "");

    var max = (a, b) => a.length > b.length ? a : b;
    var arrayMax = arr => arr.reduce((a, b) => max(a.toString(), b.toString()), "")

    var longestRuleStrings = arrayMax(ruleStrings);
    var longestRewrittenRuleStrings = arrayMax(rewrittenRuleStrings);
    var longestSubstStrings = arrayMax(substStrings);

    var rulesAndChildren = <div className="rulesAndChildren">{env.rules.map(function(rule, i) {
      if (!rule) {
        return;
      }

      if (rule.substituting) {
        var substitutingClasses = cx({
          'lineWidget': true,
          'visible': env.getCurRuleIndex() === i
        });
        var substituting = <div className={substitutingClasses}>{substStrings[i]}</div>;
      }

      var ruleClasses = cx({
        'rule': true,
        'highlight': env.getCurRuleIndex() === i,
        'succeeded': rule.hasSucceeded(),
        'failed': rule.hasFailed(),
        'shouldStrike': rule.hasFailed(),
      });

      var showOriginalRule = false;
      var showSubstituting = false;
      var showRewrittenRule = false;
      var showChildNode = false;
      if (isCurrentEnv && env.getCurRuleIndex() === i) {
        switch(trace.message) {
          case "1":
            showOriginalRule = true;
            break;
          case "2.1":
            showOriginalRule = true;
            showSubstituting = true;
            showRewrittenRule = ruleStrings[i] !== rewrittenRuleStrings[i];
            break;
          case "3":
            showRewrittenRule = true;
            showChildNode = true;
            break;
          case "2.2":
            showOriginalRule = true;
            break;
          default:
            break;
        }
      } else {
        if (rewrittenRuleStrings[i]) {
          showRewrittenRule = true;
          showChildNode = true;
        } else {
          showOriginalRule = true;
        }
      }

      var duplicatedCurrentGoal = rule.hasSucceeded() ? <div className="duplicatedCurrentGoal">{env.goals[0] ? env.goals[0].toString() : undefined}</div> : undefined;
      return <div className="ruleAndChild">
              <div className="ruleWrapper">
                {duplicatedCurrentGoal}
                <div className={ruleClasses}>
                  {showOriginalRule ? ruleStrings[i] : undefined}
                  {showSubstituting ? substituting : undefined}
                  {showRewrittenRule ? rewrittenRuleStrings[i] : undefined}
                </div>
                <div className="longestPlaceholder">
                  {showOriginalRule ? longestRuleStrings : undefined}
                  {showSubstituting ? longestSubstStrings : undefined}
                  {showRewrittenRule ? longestRewrittenRuleStrings : undefined}
                </div>
              </div>
              {showChildNode ? childNodes[i] : undefined}
            </div>
    })}</div>;

    // === labels ===
    // goals
    var numLatestGoals = env.options.numLatestGoals;
    var gcConfig = {
      'goals': true,
      'highlightLatest': shouldHighlightLatestGoals,
    };
    if (env.getCurRuleIndex() >= 0) {
      gcConfig.highlightCurrent = true;
      gcConfig.succeeded = env.getCurRule().hasSucceeded();
      gcConfig.failed = env.getCurRule().hasFailed();
    }
    var goals = <div className={cx(gcConfig)}>
                  {env.goals.map(function(goal, i, goals) {
                    var goalLabelClasses = cx({
                      'goalLabel': true,
                      'currentGoal': i === 0,
                      'latestGoal': i < numLatestGoals,
                      'firstNonLastestGoal': numLatestGoals > 0 && i === numLatestGoals,
                    });
                    return <div className={goalLabelClasses}>{goal.toString()}</div>;
                  })}
                </div>;

    // subst
    var substString = "";
    if (env.options && env.options.solution) {
      substString = env.options.solution.toString() === "yes" ? "" : env.options.solution.toString();
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
        <div className="longestPlaceholder">{longestSiblingLabel}</div>
      </div>;

    // === goal ===
    var goalClasses = cx({
      'goal': true,
      'currentEnv': isCurrentEnv,
      'solution': env.hasSolution(),
      'shouldHideRulesAndChildren': shouldHighlightLatestGoals
    });
    var goalProps = {
      env: env,
    };

    return <div key={env.envId} style={style} className={goalClasses} {...goalProps}>{labels}{rulesAndChildren}</div>;
  }
});

module.exports = Goal;
