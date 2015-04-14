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
    var {parent, env, children, trace,
        shouldHighlightLatestGoals,
        hideRulesWithIncompatibleName,
        longestSiblingLabel, isLastFrame} = this.props;
    var isCurrentEnv = !!trace;

    if (env.hasSolution()) {
      var classes = cx({
        'solution': true,
      });
      return <div className={classes}>{env.options.solution.toString()}</div>;
    }
    if (env.isEmpty()) {
      return <div></div>;
    }

    // === rule labels ===
    var rules = env.rules;
    if (hideRulesWithIncompatibleName) {
      rules = rules.map(rule => env.goals[0] && env.goals[0].name === rule.head.name ? rule : "");
    }

    var ruleStrings = rules.map((rule) => rule.toString(true, true));
    var rewrittenRuleStrings = rules.map((rule, i) => rule.rewritten ? rule.rewritten.toString(true, isCurrentEnv && env.getCurRuleIndex() === i && trace.message !== "3") : "");
    var substStrings = rules.map((rule) => rule.substituting ? "↓ subst: "+rule.substituting.toString()+" " : "");

    var max = (a, b) => a.length > b.length ? a : b;
    var arrayMax = arr => arr.reduce((a, b) => max(a.toString(), b.toString()), "")

    var longestRuleStrings = arrayMax(ruleStrings);
    var longestRewrittenRuleStrings = arrayMax(rewrittenRuleStrings);
    var longestSubstStrings = arrayMax(substStrings);

    var toSubscript = (string) => {
      if (string === undefined) {
        return;
      }
      var regex = /(_\d*)/;
      return string.split(regex).map((substr, i) => {
        if (i%2 === 0) {
          return substr;
        } else {
          return <sub key={i}>{substr.slice(1)}</sub>;
        }
      });
    };

    var rulesAndChildren = <div className="rulesAndChildren">{rules.map(function(rule, i) {
      if (!rule) {
        return;
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

      if (isLastFrame) {
        showOriginalRule = true;
        showSubstituting = true;
        showRewrittenRule = ruleStrings[i] !== rewrittenRuleStrings[i];
      }

      var originalRule;
      var substituting;
      var rewrittenRule;
      if (showOriginalRule) {
        originalRule = <div className="original">{toSubscript(ruleStrings[i])}</div>;
      }
      if (showSubstituting && rule.substituting) {
        var substitutingClasses = cx({
          'substituting': true,
          'visible': env.getCurRuleIndex() === i
        });
        substituting = <div className={substitutingClasses}>{toSubscript(showRewrittenRule ? substStrings[i] : "→"+substStrings[i].slice(1))}</div>;
      }
      if (showRewrittenRule) {
        rewrittenRule = <div className="new">{toSubscript(rewrittenRuleStrings[i])}</div>;
      }

      var duplicatedCurrentGoal;
      if (rule.hasSucceeded()) {
        var firstGoal = env.goals[0] ? toSubscript(env.goals[0].toString()) : undefined;
        duplicatedCurrentGoal = (
          <div className="duplicatedCurrentGoal">{firstGoal}</div>
        );
      }
      return <div key={"RandC#"+i} className="ruleAndChild">
              <div className="ruleWrapper">
                {duplicatedCurrentGoal}
                <div className={ruleClasses}>
                  {originalRule}{substituting}{rewrittenRule}
                </div>
                <div className="longestPlaceholder">
                  {showOriginalRule ? <div>{toSubscript(longestRuleStrings)}</div> : undefined}
                  {showSubstituting ? <div>{toSubscript(longestSubstStrings)}</div> : undefined}
                  {showRewrittenRule ? <div>{toSubscript(longestRewrittenRuleStrings)}</div> : undefined}
                </div>
              </div>
              {showChildNode ? <div className={cx({goalWrapper: true, hideMargin: isLastFrame && showRewrittenRule})}>
                                {isLastFrame && showRewrittenRule ? "\n\n" : undefined}
                                {children[i]}
                              </div> : undefined}
            </div>;
    })}</div>;

    // === labels ===
    // goals
    var {numLatestGoals, solution} = env.options;
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
                    return <div key={"goal#"+i} className={goalLabelClasses}>{toSubscript(goal.toString())}</div>;
                  })}
                </div>;

    // subst
    var substString = !solution || solution.toString() === "yes" ? undefined : solution.toString();
    var subst = <div className="subst">{toSubscript(substString)}</div>;

    // label
    var labelsClasses = cx({
      'labels': true,
    });
    var labelsProps = {
      // onMouseEnter: parent.onMouseOverPExpr.bind(parent, node),
      // onMouseLeave: parent.onMouseOutPExpr,
      // onClick: parent.onClickPExpr.bind(parent, node),
    };
    var labels = <div key={"labels"} className={labelsClasses} {...labelsProps}>
        <div className="contents">{goals}{subst}</div>
        <div className="longestPlaceholder">{longestSiblingLabel}</div>
      </div>;

    // === goal ===
    var goalClasses = cx({
      'goal': true,
      'currentEnv': isCurrentEnv,
      'shouldHideRulesAndChildren': shouldHighlightLatestGoals
    });
    var goalProps = {
      env: env,
    };

    return <div key={env.envId} style={style} className={goalClasses} {...goalProps}>{labels}{rulesAndChildren}</div>;
  }
});

module.exports = Goal;
