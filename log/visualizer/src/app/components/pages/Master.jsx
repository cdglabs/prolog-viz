var React = require('react');
var Router = require('react-router');
var mui = require('material-ui');
var AppBar = mui.AppBar;
var AppCanvas = mui.AppCanvas;
var Menu = mui.Menu;
var IconButton = mui.IconButton;
RouteHandler = Router.RouteHandler;
var Help = require('../components/Help.jsx');
var Dialog = mui.Dialog;
var marked = require('marked');

// using brfs transform
var fs = require('fs');
var text = fs.readFileSync(__dirname + '/About.md', 'utf8');

function getStateFromStores() {
  return {
    // languages: EditorStore.getLanguages(),
  };
}

var EditorActionCreators = require('../../actions/EditorActionCreators.js');

var Demo = React.createClass({
  mixins: [Router.State, Router.Navigation],

  getInitialState: function() {
    return getStateFromStores();
  },

  propTypes: {
    // single child
    // children: React.PropTypes.element.isRequired
  },

  componentDidMount: function() {
    // load grammar from script tag
    EditorActionCreators.didMount();
  },

  onHelpButtonTouchTap: function() {
    this.refs.about.show();
  },

  render: function() {
    var title = "Prolog Visualizer";

    var githubButton = (
      <IconButton
        className="github-icon-button"
        iconClassName="muidocs-icon-custom-github"
        href="https://github.com/zhxnlai/printf"
        linkButton={true}/>
    );
    var helpButton = (
      <IconButton className="help-button" onTouchTap={this.onHelpButtonTouchTap}>
        <Help/>
      </IconButton>
    );

    //Standard Actions
    var standardActions = [
      { text: 'Close' },
    ];
    var rawMarkup = marked(text);
    var about = (
      <Dialog ref="about" title="About Prolog Visualizer" actions={standardActions}>
        <span dangerouslySetInnerHTML={{__html: rawMarkup}} />
      </Dialog>
    );

    return (
      <AppCanvas className="master" predefinedLayout={1}>
        <AppBar
          className="mui-dark-theme"
          title={title}
          zDepth={1}
          showMenuIconButton={false}>
          <div className="appbar-icon-group">
            {helpButton}
            {githubButton}
          </div>
        </AppBar>

        <RouteHandler key={"pv"} /*this.getPath()*/ />
        {about}
      </AppCanvas>
    );
  }
});

module.exports = Demo;
