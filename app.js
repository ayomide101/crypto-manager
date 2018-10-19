var crypto = require("./modules/crypto");

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var compression = require('compression');

var index = require('./routes/index');
var angularApp = require('./routes/app');
var api = require('./routes/api');
var helmet = require('helmet');



crypto.initCryptos();

var app = express();

//HTTPS Support
app.use(helmet.hsts({
    maxAge: 31536000000,
    includeSubdomains: true,
    force: true
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(compression());
app.use(express.static(path.join(__dirname, 'public')));

var sessionConfig = require('./modules/functions').getConfig('session.security');
sessionConfig.genid = function() {
    return require('crypto').randomBytes(48).toString('hex');
};
app.use(session(sessionConfig));

if(process.env.ENVIRONMENT === 'production'){
    app.use(function (req, res, next) {
    	if (!req.secure) return res.redirect('https://' + req.headers.host + req.url);
    	next();
    });
}

if(!require('./modules/functions').getConfig('maintenance_mode')){
    app.use('/', index);
    app.use('/api', api);
    app.use('/app', angularApp);
} else {
    app.use('/', require('./routes/maintenance'));
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handler
app.use(function(err, req, res, next) {
	var current_year = (new Date()).getFullYear();
	var template_components = {header: 'components/header', footer: 'components/footer', loginModal: 'components/login-modal'};
	var base_url = require('./modules/functions').getConfig('base_url');

	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	console.log(res.locals.message);
	console.log(res.locals.error.stack);

	// render the error page
	var template_properties = {base_url: base_url, default_menu: true, logo: 'logo', logo_dark: 'logo-dark', has_footer: true, current_year: current_year, partials: template_components};
	res.status(err.status || 500);
	template_properties.title = 'Error Page';
	require('./modules/functions').dispatch('error', template_properties, req, res, next);
});

module.exports = app;