var React = require('react/addons');
var Router = require('react-router');
var Route = Router.Route;
var Routes = Router.Routes;
var Redirect = Router.Redirect;
var DefaultRoute = Router.DefaultRoute;
var NotFoundRoute = Router.NotFoundRoute;

var Master = require('./components/pages/Master.jsx');
var Demo = require('./components/pages/demo.jsx');

var AppRoutes = (
  <Route name="root" path="/" handler={Master}  >
    <Route name="examples" path="examples/:exampelName" handler={Demo} />
    <DefaultRoute name="demo" handler={Demo} />
  </Route>


);

module.exports = AppRoutes;
