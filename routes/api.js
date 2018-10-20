import express from "express";

import functions from "../modules/functions";

import User from "../modules/user-account";

import orderRequest from "../modules/order-request";
import * as fs from "fs";

const jwt = require('express-jwt');


const router = express.Router();
const base_url = functions.getConfig('base_url');
const user = new User();

/**
 * Checks if JWT token has been revoked
 * @param req
 * @param payload
 * @param done
 */
const isRevokedCallback = function (req, payload, done) {
    const issuer = payload.iss;
    const tokenId = payload.jti;

    user.getRevokedToken(issuer, tokenId, function (err, isRev) {
        if (err) {
            return done(err);
        }
        return done(null, isRev);
    });
};


//Protect routes by JWT(JSON Web Tokens)
router.use(jwt(
    {
        secret: fs.readFileSync(functions.getConfig("session.security").publickey),
        issuer: "cryptomanager",
        requestProperty: 'auth',
        isRevoked: isRevokedCallback
    }));


router.get('/', function (req, res) {
    console.log(req.auth);
    res.send('Hello');
});


router.get('/user/profile', function (req, res) {
    user
        .getDetails(req.auth.uid)
        .then(function (response) {
            res.send(response);
        }, function (error) {
            console.log(error);
            res.send(error);
        });
});

router.post('/user/update/info', function (req, res) {
    user
        .updateInfo(req.auth.uid, {
            name: req.bodyString("name"),
            phonenumber: req.bodyString("phonenumber"),
            email: req.bodyEmail("email"),
        })
        .then(function (response) {
            return user.getDetails(req.auth.uid);
        })
        .then(function (response) {
            res.send(response)
        }, function (err) {
            console.log(err);
            res.send(err)
        });
});

router.post('/user/update/password', function (req, res) {
    console.log(`User trying to update`);
    const oldPassword = req.bodyString("oldPassword");
    const newPassword = req.bodyString("newPassword");

    user.updatePassword(req.auth.uid, oldPassword, newPassword)
        .then(function (response) {
            console.log(response);
            res.send(response);
        }, function (error) {
            console.log(error);
            res.send(error);
        });
});


module.exports = router;
