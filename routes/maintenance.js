/**
 * Created by Ayomide on 16/04/2017.
 */

var express = require('express');
var router = express.Router();

var current_year = (new Date()).getFullYear();
var template_components = {
    header: 'components/header',
    footer: 'components/footer',
    loginModal: 'components/login-modal'
};

var functions = require('../modules/functions');
var base_url = functions.getConfig('base_url');
var dispatch = function(view_component, template_properties, req, res, next){
    functions.dispatch(view_component, template_properties, req, res, next);
};

/* GET maintenance page. */
router.get('*', function(req, res, next) {
    var template_properties = {base_url: base_url, default_menu: true, logo: 'logo-black', logo_dark: 'logo-black', no_transition: true, has_footer: true, current_year: current_year, partials: template_components};
    template_properties.logo_property = 'class="divcenter"';
    template_properties.title = 'maintenance';
    template_properties.default_menu = false;
    template_properties.has_footer = false;
    dispatch('maintenance', template_properties, req, res, next);
});

module.exports = router;