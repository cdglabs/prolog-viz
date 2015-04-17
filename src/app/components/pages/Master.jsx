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
  };
}

var EditorActionCreators = require('../../actions/EditorActionCreators.js');

var Demo = React.createClass({
  mixins: [Router.State, Router.Navigation],

  getInitialState: function() {
    return getStateFromStores();
  },

  componentDidMount: function() {
    // load grammar from script tag
    EditorActionCreators.didMount();
    // http://patorjk.com/software/taag/#p=display&f=Ivrit&t=Prolog%20Visualizer!
    console.log("  ____            _              __     ___                 _ _              _ \n |  _ \\ _ __ ___ | | ___   __ _  \\ \\   / (_)___ _   _  __ _| (_)_______ _ __| |\n | |_) | '__/ _ \\| |/ _ \\ / _` |  \\ \\ / /| / __| | | |/ _` | | |_  / _ \\ '__| |\n |  __/| | | (_) | | (_) | (_| |   \\ V / | \\__ \\ |_| | (_| | | |/ /  __/ |  |_|\n |_|   |_|  \\___/|_|\\___/ \\__, |    \\_/  |_|___/\\__,_|\\__,_|_|_/___\\___|_|  (_)\n                          |___/                                                ");
    // console.log("Join us at career.cdglabs.com");
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
