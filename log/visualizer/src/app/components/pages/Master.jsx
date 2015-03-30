var React = require('react');
var Router = require('react-router');
var mui = require('material-ui');
var AppBar = mui.AppBar;
var AppCanvas = mui.AppCanvas;
var Menu = mui.Menu;
var IconButton = mui.IconButton;
RouteHandler = Router.RouteHandler;

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
    children: React.PropTypes.element.isRequired
  },

  componentDidMount: function() {
    // load grammar from script tag
    EditorActionCreators.didMount();
  },

  render: function() {
    var title = "Prolog Visualizer";

    var githubButton = (
      // <IconButton iconClassName="muidocs-icon-custom-github" tooltip="GitHub"/>

      <IconButton
        className="github-icon-button"
        iconClassName="muidocs-icon-custom-github"
        href="https://github.com/zhxnlai/printf"
        linkButton={true} tooltip="GitHub"/>
    );

    return (
      <AppCanvas className="master" predefinedLayout={1}>
        <AppBar
          className="mui-dark-theme"
          title={title}
          zDepth={1}
          showMenuIconButton={false}>
          {githubButton}
        </AppBar>

        <RouteHandler key={this.getPath()} />

      </AppCanvas>

    );
  }

});


/*
<div className="page-with-nav">
  <div className="header">
  </div>
  <div className="content">
    {this.props.children}
  </div>
</div>

*/
module.exports = Demo;
