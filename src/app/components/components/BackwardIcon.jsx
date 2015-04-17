var React = require('react');
var mui = require('material-ui');
var SvgIcon = mui.SvgIcon;

var Back = React.createClass({

  render: function() {
    return (
      <SvgIcon {...this.props}>
        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
      </SvgIcon>
    );
  }

});

module.exports = Back;
