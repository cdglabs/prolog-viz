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

  // not arrow
  // <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
  // <path d="M23.12 11.12L21 9l-9 9 9 9 2.12-2.12L16.24 18z"/>

  // back
  // <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
  // <path d="M30 16.5H11.74l8.38-8.38L18 6 6 18l12 12 2.12-2.12-8.38-8.38H30v-3z"/>

});

module.exports = Back;
