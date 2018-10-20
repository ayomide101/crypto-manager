import CryptoCore from "./modules/cryptoCore";
import express from "express";
import path from "path";
import favicon from "serve-favicon";
import logger from "morgan";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import session from "express-session";
import compression from "compression";
import index from "./routes/index";
import angularApp from "./routes/app";
import api from "./routes/api";
import authorize from "./routes/authorize";
import helmet from "helmet";
import Functions from "./modules/functions";

CryptoCore.initCryptos();

const app = express();

//HTTPS Support
app.use(helmet.hsts({
    maxAge: 31536000000,
    includeSubdomains: true,
    force: true
}));
app.use(require('sanitize').middleware);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(compression());
app.use(express.static(path.join(__dirname, 'public')));

var sessionConfig = Functions.getConfig('session.security');
sessionConfig.genid = function () {
    return require('crypto').randomBytes(48).toString('hex');
};
app.use(session(sessionConfig));

if (process.env.ENVIRONMENT === 'production') {
    app.use(function (req, res, next) {
        if (!req.secure) return res.redirect('https://' + req.headers.host + req.url);
        next();
    });
}

if (!Functions.getConfig('maintenance_mode')) {


    app.use('/', index);
    app.use('/authorize', authorize);
    app.use('/api', api);
    app.use('/app', angularApp);
} else {
    app.use('/', require('./routes/maintenance'));
}

// catch 404 and forward to error handler
// app.use(function (req, res, next) {
//     var err = new Error('Not Found');
//     err.status = 404;
//     next(err);
// });

// error handler
// app.use(function (err, req, res, next) {
//     const current_year = (new Date()).getFullYear();
//     const template_components = {
//         header: 'components/header',
//         footer: 'components/footer',
//         loginModal: 'components/login-modal'
//     };
//     const base_url = Functions.getConfig('base_url');
//
//     // set locals, only providing error in development
//     res.locals.message = err.message;
//     res.locals.error = req.app.get('env') === 'development' ? err : {};
//
//     console.log(res.locals.message);
//     console.log(res.locals.error.stack);
//
//     // render the error page
//     var template_properties = {
//         base_url: base_url,
//         default_menu: true,
//         logo: 'logo',
//         logo_dark: 'logo-dark',
//         has_footer: true,
//         current_year: current_year,
//         partials: template_components
//     };
//     res.status(err.status || 500);
//     template_properties.title = 'Error Page';
//     Functions.dispatch('error', template_properties, req, res, next);
// });

module.exports = app;