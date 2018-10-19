var express = require('express');
var router = express.Router();

var current_year = (new Date()).getFullYear();
var template_components = {
    header: 'components/header',
    footer: 'components/footer',
    loginModal: 'components/login-modal',
    registerModal: 'components/register-modal',
    noConnection: 'components/no-connection'
};

var functions = require('../modules/functions');
var base_url = functions.getConfig('base_url');
var dispatch = function(view_component, template_properties, req, res, next){
	functions.dispatch(view_component, template_properties, req, res, next);
};

/* GET home page. */
router.get('/', function(req, res, next) {
    var template_properties = {base_url: base_url, default_menu: true, logo: 'logo', logo_dark: 'logo-dark', no_transition: true, has_footer: true, current_year: current_year, partials: template_components, include_app: true, base: '/'};
	// template_properties.header_property = 'class="transparent-header page-section"';
	template_properties.title = 'Simple, Creative & Flexible';
	dispatch('index', template_properties, req, res, next);
});

/* User Account Logout. */
router.get('/logout', function(req, res, next) {
	var sessionId = functions.getConfig('session.security').name;
	require('../modules/user-account').userLogout(req.cookies[sessionId], function(response){
		res.redirect(base_url);
	});
});

module.exports = router;
