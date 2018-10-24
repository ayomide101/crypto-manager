import functions from "../modules/functions";
import express from "express";
import User from "../modules/user-account";
import {UnauthorizedError} from "express-jwt";
import Error from "../modules/errors"


const router = express.Router();
const base_url = functions.getConfig('base_url');
const user = new User();

/**
 * Authorize user login with 2FA
 */
router.post('/login/2fa', function (req, res) {
    user
        .confirm2FA(req.bodyInt("otp"), req.bodyString("token"))
        .then(function (response) {
            res.send(response)
        }, function (err) {
            // console.log(err);
            res.send(err);
        });
});

/**
 * Check if a jwt is still valid
 */
router.post('/login/status', function (req, res) {
    let token = req.bodyString('jwt');
    let jwt = require('jsonwebtoken');
    const d  = new UnauthorizedError('revoked_token', {message: 'The token has been revoked.'});
    try {
        let dtoken = jwt.decode(token, { complete: true }) || {};
        const {jti, iss} =dtoken.payload;
        user.getRevokedToken(iss, jti, function (err, isRev) {
            if (err) {
                req.status(401);
                res.send(d);
            } else {
                res.send(Error.successError("Still login"));
            }
        });
    } catch (err) {
        req.status(401);
        res.send(d);
    }
});

/**
 * Login to user account
 * Sends OTP to user email address for confirmation
 */
router.post('/login', function (req, res) {
    user
        .emailAuthenticate(req.bodyEmail('email'), req.bodyString("password"))
        .then(function (response) {
            res.send(response)
        }, function (err) {
            // console.log(err);
            res.send(err)
        });
});

/**
 * Resend OTP
 */
router.post('/resendOtp', function (req, res) {
    user
        .resendOTP(req.bodyString('token'))
        .then(function (response) {
            res.send(response)
        }, function (err) {
            // console.log(err);
            res.send(err)
        });
});

/**
 * Reset user password
 */
router.post('/forgot-password', function (req, res) {
    var email = (req.body.email === 'undefined') ? '' : req.body.email;
    user.requestPasswordReset(email, function (response) {
        res.send(response)
    }, function (err) {
        res.send(err)
    });
});

/**
 * Create a new user account
 */
router.post('/sign-up', function (req, res) {
    user
        .createAccount(req.bodyEmail("email"), req.bodyString("password"), req.bodyString("name"), req.bodyString("phonenumber"))
        .then(function (response) {
            res.send(response);
        }, function (err) {
            res.send(err);
        });
});
/**
 * Activate user account
 */
router.get('/activate', function (req, res) {
    const code = req.queryString("code");
    user
        .activateAccount(code)
        .then(function (response) {
            res.send(response);
        }, function (err) {
            res.send(err);
        });
});


module.exports = router;