var React = require('react');
var Router = require('react-router');
var RouteHandler = Router.RouteHandler;
var mui = require('material-ui');
var AppBar = mui.AppBar;
var AppCanvas = mui.AppCanvas;
var Menu = mui.Menu;
var IconButton = mui.IconButton;
var Dialog = mui.Dialog;
var Help = require('../components/Help.jsx');
var Info = require('../components/Info.jsx');
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

    // add link to app bar title
    var titleEl = document.querySelector(".mui-app-bar-title");
    if (titleEl) {
      titleEl.innerHTML = "<a href='#/'>"+titleEl.innerText+"</a>";
    }
  },

  onHelpButtonTouchTap: function() {
    this.refs.about.dismiss();
    this.refs.help.show();
  },

  onInfoButtonTouchTap: function() {
    this.refs.help.dismiss();
    this.refs.about.show();
  },

  render: function() {
    var title = "Prolog Visualizer";

    var githubButton = (
      <IconButton
        className="github-icon-button"
        iconClassName="muidocs-icon-custom-github"
        href="https://github.com/cdglabs/prolog"
        linkButton={true}/>
    );
    var helpButton = (
      <IconButton className="help-button" onTouchTap={this.onHelpButtonTouchTap}>
        <Help/>
      </IconButton>
    );
    var infoButton = (
      <IconButton className="info-button" onTouchTap={this.onInfoButtonTouchTap}>
        <Info/>
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
    var help = (
      <Dialog ref="help" title="Prolog Visualizer Tutorial" actions={standardActions}>
        <iframe src="//www.slideshare.net/slideshow/embed_code/key/6OYeQsWj8blF6o" width="595" height="485" frameborder="0" marginwidth="0" marginheight="0" scrolling="no" style={{"border":"1px solid #CCC", "border-width":"1px", "margin-bottom":"5px", "max-width": "100%"}} allowfullscreen> </iframe>      </Dialog>
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
            {infoButton}
            {githubButton}
          </div>
        </AppBar>

        <RouteHandler key={"pv"} /*this.getPath()*/ />
          {about}
          {help}
      </AppCanvas>
    );
  }
});

module.exports = Demo;
