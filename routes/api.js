import express from "express";

import functions from "../modules/functions";

import User from "../modules/user-account";

import orderRequest from "../modules/order-request";
import Database from "../common/database";
import * as fs from "fs";
const jwt = require('express-jwt');


const router = express.Router();
const base_url = functions.getConfig('base_url');
const user = new User();

const isRevokedCallback = function(req, payload, done){
    const issuer = payload.iss;
    const tokenId = payload.jti;

    user.getRevokedToken(issuer, tokenId, function(err, isRev){
        if (err) { return done(err); }
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
    res.send('Hello');
});


router.get('/login/status', function (req, res) {
    var sessionId = functions.getConfig('session.security').name;
    user.checkLoggedIn(req.cookies[sessionId], function (loggedIn) {
        // console.log(userDetails);
        var response = {
            error: 401,
            message: 'Unauthorized, login required'
        };
        if (loggedIn) {
            response.error = 200;
            response.message = 'Authorized, user has signed in';

            var database = new functions.database();
            database.update('user_tokens',
                {session_id: req.cookies[sessionId]},
                {expires_on: ((new Date()).getTime() + functions.getConfig('session.security').session_duration)});
            database.close();
        }
        res.send(JSON.stringify(response));
    });
});

router.get('/get-estimate', function (req, res) {
    var pickup = req.query.pickup;
    var dropoff = req.query.dropoff;
    var sizefit = (typeof req.query.sizefit === 'undefined') ? '' : req.query.sizefit;
    var type = (typeof req.query.type === 'undefined') ? '' : req.query.type;
    var value = (typeof req.query.value === 'undefined') ? '' : req.query.value;

    orderRequest.getEstimate(pickup, dropoff, sizefit, type, value, function (response) {
        console.log(response);
        res.send(response)
    }, function (err) {
        console.log(err);
        try {
            JSON.parse(err)
        } catch (e) {
            err = {error: 400, message: 'Failed to calculate estimate'};
        }
        res.send(err);
    });
});

router.get('/user/profile', function (req, res) {
    var sessionId = functions.getConfig('session.security').name;
    user.getAuthDetails(req.cookies[sessionId], function (err, resp) {
        if (resp.length > 0) {
            var auth_info = JSON.parse(resp[0].auth_info);
            user.getDetails(auth_info.jwt_token, function (response) {
                res.send(response);
            }, function (error) {
                console.log(error);
                res.send(error);
            });
        } else {
            res.send(err);
        }
    });
});

router.get('/user/history', function (req, res) {
    var sessionId = functions.getConfig('session.security').name;
    user.getAuthDetails(req.cookies[sessionId], function (err, resp) {
        var auth_info = JSON.parse(resp[0].auth_info);
        orderRequest.getHistory(auth_info.jwt_token, function (response) {
            // console.log(response);
            res.json(response);
        }, function (error) {
            console.log(error);
            res.send(error);
        });
    });
});

router.get('/express-methods', function (req, res) {
    var sessionId = functions.getConfig('session.security').name;
    user.getAuthDetails(req.cookies[sessionId], function (err, resp) {
        if (resp.length > 0) {
            var auth_info = JSON.parse(resp[0].auth_info);
            orderRequest.paymentMethods(auth_info.jwt_token, function (resp) {
                var data = [];
                for (var i = 0; i < resp.data.length; i++) {
                    if (typeof resp.data[resp.data.length - (i + 1)].card !== "undefined" && resp.data[resp.data.length - (i + 1)].card !== null) {
                        if (typeof resp.data[resp.data.length - (i + 1)].card.token !== "undefined")
                            delete resp.data[resp.data.length - (i + 1)].card.token;
                        if (typeof resp.data[resp.data.length - (i + 1)].card.number !== "undefined")
                            delete resp.data[resp.data.length - (i + 1)].card.number;
                        if (typeof resp.data[resp.data.length - (i + 1)].card.cvc !== "undefined")
                            delete resp.data[resp.data.length - (i + 1)].card.cvc;
                        if (typeof resp.data[resp.data.length - (i + 1)].card.expiryMonth !== "undefined")
                            delete resp.data[resp.data.length - (i + 1)].card.expiryMonth;
                        if (typeof resp.data[resp.data.length - (i + 1)].card.expiryYear !== "undefined")
                            delete resp.data[resp.data.length - (i + 1)].card.expiryYear;
                    }

                    if (typeof resp.data[resp.data.length - (i + 1)].bankAccount !== "undefined" && resp.data[resp.data.length - (i + 1)].bankAccount !== null) {
                        if (typeof resp.data[resp.data.length - (i + 1)].bankAccount.token !== "undefined")
                            delete resp.data[resp.data.length - (i + 1)].bankAccount.token;
                        if (typeof resp.data[resp.data.length - (i + 1)].bankAccount.accountNumber !== "undefined")
                            delete resp.data[resp.data.length - (i + 1)].bankAccount.accountNumber;
                        if (typeof resp.data[resp.data.length - (i + 1)].bankAccount.bank_code !== "undefined")
                            delete resp.data[resp.data.length - (i + 1)].bankAccount.bank_code;
                    }

                    data[i] = resp.data[resp.data.length - (i + 1)];
                }
                resp.data = data;
                res.send(resp)
            }, function (err) {
                res.send(err);
            });
        } else {
            res.send(err)
        }
    });
});

router.post('/user/update/info', function (req, res) {
    var sessionId = functions.getConfig('session.security').name;
    user.getAuthDetails(req.cookies[sessionId], function (err, resp) {
        if (resp.length > 0) {
            var fullName = (req.body.fullname === 'undefined') ? '' : req.body.fullname;
            var phoneNumber = (req.body.phonenumber === 'undefined') ? '' : req.body.phonenumber;
            var auth_info = JSON.parse(resp[0].auth_info);
            user.updateInfo(auth_info.jwt_token, auth_info.ownerid, {
                name: fullName,
                phonenumber: phoneNumber
            }, function (response) {
                user.getDetails(auth_info.jwt_token, function (response1) {
                    response.data = response1.data;
                    res.send(response);
                }, function (error) {
                    res.send(error);
                });
            }, function (error) {
                console.log(error);
                res.send(error);
            });
        } else {
            res.send(err)
        }
    });
});

router.post('/user/update/password', function (req, res) {
    var sessionId = functions.getConfig('session.security').name;
    user.getAuthDetails(req.cookies[sessionId], function (err, resp) {
        if (resp.length > 0) {
            var auth_info = JSON.parse(resp[0].auth_info);
            user.getDetails(auth_info.jwt_token, function (response) {
                var email = (typeof response.data.email !== 'undefined') ? response.data.email : "";
                var password = (req.body.password === 'undefined') ? '' : req.body.password;
                var newPassword = (req.body.new_password === 'undefined') ? '' : req.body.new_password;
                var confirmPassword = (req.body.confirm_password === 'undefined') ? '' : req.body.confirm_password;
                user.emailAuthenticate(email, password, function (response1) {
                    if (response1.error == 200) {
                        if (newPassword == confirmPassword) {
                            user.updatePassword(auth_info.jwt_token, {
                                oldPassword: password,
                                newPassword: newPassword
                            }, function (response) {
                                console.log(response);
                                res.send(response);
                            }, function (error) {
                                console.log(error);
                                res.send(error);
                            });
                        } else {
                            console.log({error: 400, message: "Password Mismatch, confirm password"});
                            res.send({error: 400, message: "Password Mismatch, confirm password"});
                        }
                    } else {
                        console.log(response);
                        // response.message = "Invalid Password";
                        res.send(response)
                    }
                }, function (err) {
                    console.log(err);
                    res.send(err)
                });
            }, function (err) {
                res.send(err)
            });
        } else {
            res.send(err)
        }
    });
});


module.exports = router;
