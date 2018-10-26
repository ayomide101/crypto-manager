import express from "express";
import functions from "../modules/functions";
import User from "../modules/user-account";
import * as fs from "fs";
import Wallet from "../modules/wallet";

const jwt = require('express-jwt');

Array.prototype.isEmpty = function () {
    return this.length <= 0;
};

const router = express.Router();
const base_url = functions.getConfig('base_url');
const user = new User();
const wallet = new Wallet();

const log = function(message, error) {
    if (error) {
        console.error(message);
    } else {
        console.log(message);
    }
};

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
    log(req.auth);
    res.send('Hello');
});


/**
 * Get user profile
 */
router.get('/user/profile', function (req, res) {
    user
        .getDetails(req.auth.uid)
        .then(function (response) {
            res.send(response);
        }, function (error) {
            log(error, true);
            res.send(error);
        });
});

/**
 * Update user information
 */
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
            log(err, true);
            res.send(err)
        });
});

/**
 * Update password
 */
router.post('/user/update/password', function (req, res) {
    log(`User trying to update`);
    const oldPassword = req.bodyString("oldPassword");
    const newPassword = req.bodyString("newPassword");

    user.updatePassword(req.auth.uid, oldPassword, newPassword)
        .then(function (response) {
            log(response);
            res.send(response);
        }, function (error) {
            log(error, true);
            res.send(error);
        });
});

/**
 * Create friend
 */
router.post('/wallet/createFriend', function (req, res) {
    log(`Create friend`);
    wallet
        .createFriend(req.auth.uid, req.bodyString('name'), req.bodyString('wallet'), req.bodyString('wallet_address'))
        .then(function (response) {
            log(response);
            res.send(response);
        }, function (error) {
            log(error, true);
            res.send(error);
        });
});

/**
 * Delete friend
 */
router.post('/wallet/deleteFriend', function (req, res) {
    log(`Delete friend`);
    wallet
        .deleteFriend(req.auth.uid, req.bodyString('frnid'))
        .then(function (response) {
            log(response);
            res.send(response);
        }, function (error) {
            log(error, true);
            res.send(error);
        });
});


/**
 * Get friends
 */
router.get('/wallet/friends', function (req, res) {
    log('Get friends');

    wallet
        .getFriends(req.auth.uid)
        .then(function (response) {
            log(response);
            res.send(response);
        }, function (error) {
            log(error, true);
            res.send(error);
        });
});

/**
 * Get wallet cryptos
 */
router.get('/wallet/cryptos', function (req, res) {
    wallet
        .getSupportedCryptos()
        .then(function (response) {
            log(response);
            res.send(response);
        }, function (error) {
            log(error, true);
            res.send(error);
        });
});

/**
 * Create wallet crytos
 */
router.post('/wallet/createWallet', function (req, res) {
    wallet
        .createWallet(req.auth.uid, req.bodyString("wallet"))
        .then(function (response) {
            log(response);
            res.send(response);
        }, function (error) {
            log(error, true);
            res.send(error);
        });
});

/**
 * Get wallets
 */
router.get('/wallet/getWallets', function(req, res) {
    wallet.getWallets(req.auth.uid)
        .then(function(response) {
            log(response);
            res.send(response);
        })
        .catch(reason => {
            log(reason, true);
            res.send(reason);
        });
});

/**
 * Get wallets
 */
router.get('/wallet/getTransactions', function(req, res) {
    wallet.getTransactions(req.auth.uid)
        .then(function(response) {
            log(response);
            res.send(response);
        })
        .catch(reason => {
            log(reason, true);
            res.send(reason);
        });
});



/**
 * Create Wallet Address
 */
router.post('/wallet/createAddress', function(req, res) {
    wallet.createWalletAddress(req.auth.uid, req.bodyString("wallet"), req.bodyString("identifier"))
        .then(function(response) {
            log(response);
            res.send(response);
        })
        .catch(reason => {
            log(reason, true);
            res.send(reason);
        });
});

/**
 * Prepare transaction for OTP confirmation
 */
router.post('/wallet/sendTransaction', function(req, res) {
    wallet.sendMoneyToWallet(req.auth.uid, req.bodyString('crypto'), req.bodyString('crypto_address'), req.bodyFloat('amount'), req.bodyString("identifier"))
        .then(function(response) {
            log(response);
            res.send(response);
        })
        .catch(reason => {
            log(reason, true);
            res.send(reason);
        });
});

/**
 * Confirm transaction with OTP
 */
router.post('/wallet/confirmTransaction', function(req, res) {
    wallet.confirmTransaction(req.auth.uid, req.bodyString('otp'), req.bodyString("token"))
        .then(function(response) {
            log(response);
            res.send(response);
        })
        .catch(reason => {
            log(reason, true);
            res.send(reason);
        });
});


module.exports = router;
