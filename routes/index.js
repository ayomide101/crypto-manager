import Functions from "../modules/functions";
import Wallet from "../modules/wallet";
import CryptoCore from "../modules/cryptoCore";

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
const base_url = Functions.getConfig('base_url');
const dispatch = function (view_component, template_properties, req, res, next) {
    Functions.dispatch(view_component, template_properties, req, res, next);
};

/* GET home page. */
router.get('/', function (req, res, next) {
    var template_properties = {
        base_url: base_url,
        default_menu: true,
        logo: 'logo',
        logo_dark: 'logo-dark',
        no_transition: true,
        has_footer: true,
        current_year: current_year,
        partials: template_components,
        include_app: true,
        base: '/'
    };
    // template_properties.header_property = 'class="transparent-header page-section"';
    template_properties.title = 'Create an Account';
    dispatch('index', template_properties, req, res, next);
});

router.get('/dashboard', function (req, res, next) {
    var template_properties = {
        base_url: base_url,
        default_menu: true,
        logo: 'logo',
        logo_dark: 'logo-dark',
        no_transition: true,
        has_footer: true,
        current_year: current_year,
        partials: template_components,
        include_app: true,
        base: '/'
    };
    // template_properties.header_property = 'class="transparent-header page-section"';
    template_properties.title = 'Manage Wallets';

    const supportedCryptos = [];

    for (var key in CryptoCore.supported_cryptos) {
        var crypto = CryptoCore.getCrypto(key);
        console.log(crypto);
        supportedCryptos.push({name: key, currency:crypto.getCurrency()});
    }

    template_properties.supportedCryptos = supportedCryptos;
    dispatch('dashboard', template_properties, req, res, next);
});

/* User Account Logout. */
router.get('/logout', function (req, res, next) {
    const sessionId = Functions.getConfig('session.security').name;
    new require('../modules/user-account').userLogout(req.cookies[sessionId], function (response) {
        res.redirect(base_url);
    });
});

module.exports = router;
