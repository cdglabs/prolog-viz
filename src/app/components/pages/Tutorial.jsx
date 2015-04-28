var React = require('react');
var Router = require('react-router');

var Tutorial = React.createClass({
  mixins: [Router.State, Router.Navigation],

  render: function() {
    return (
      <div className="tutorial-page">
        <iframe src="//www.slideshare.net/slideshow/embed_code/key/6OYeQsWj8blF6o" width="595" height="485" frameborder="0" marginwidth="0" marginheight="0" scrolling="no" style={{border:"1px solid #CCC", "border-width":"1px", "margin-bottom":"5px", "max-width": "100%"}} allowfullscreen> </iframe> <div style={{"margin-bottom":"5px"}}> <strong> <a href="//www.slideshare.net/ZhixuanLai/prolog-visualizer" title="Prolog Visualizer" target="_blank">Prolog Visualizer</a> </strong> from <strong><a href="//www.slideshare.net/ZhixuanLai" target="_blank">Zhixuan Lai</a></strong> </div>
      </div>
    );
  }

});

module.exports = Tutorial;
