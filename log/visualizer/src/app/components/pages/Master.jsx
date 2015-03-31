var React = require('react');
var Router = require('react-router');
var mui = require('material-ui');
var AppBar = mui.AppBar;
var AppCanvas = mui.AppCanvas;
var Menu = mui.Menu;
var IconButton = mui.IconButton;
RouteHandler = Router.RouteHandler;
var html2canvas = require('html2canvas');

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

  onPrinterButtonTouchTap: function() {
    // html2canvas(document.body, {
    //     onrendered: function (canvas) {
    //         var imgSrc = canvas.toDataURL();
    //         var popup = window.open(imgSrc);
    //         console.log("here");
    //     }
    // });

    // html2canvas(document.body, {
    //     allowTaint: true,
    //     logging:true,
    //     onrendered: function(canvas) {
    //     imagestring = canvas.toDataURL("image/png");
    //     console.log(imagestring);
    //     document.body.appendChild(canvas);
    //     }
    // });

    // html2canvas(document.body).then(function(canvas) {
    // // document.body.appendChild(canvas);
    // console.log("here");
    // var imgSrc = canvas.toDataURL();
    // console.log(imgSrc);
    // var popup = window.open(imgSrc);
    // console.log("here");
    //
    // });

    // console.log(document.querySelector("body > div > div.demo-page > div.rightPanel > div > div"));
    var canvas = html2canvas(document.querySelector("body > div > div.demo-page > div.rightPanel > div > div").cloneNode(true) , {
      onrendered: function(canvas) {
        console.log("here");
        document.body.appendChild(canvas);
      }
    });
    // console.log(canvas);
  },

  render: function() {
    var title = "Prolog Visualizer";


    // var printButton = (
    //   // <IconButton iconClassName="muidocs-icon-custom-github" tooltip="GitHub"/>
    //
    //   <IconButton
    //     className="print-button"
    //     iconClassName="muidocs-icon-action-thumb-up"
    //     onTouchTap={this.onPrinterButtonTouchTap} tooltip="GitHub"/>
    // );
    // {printButton}


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
