import Functions from "./functions";

const functions = require("./functions");
import Database from "../common/database";
import crypto from "crypto";
import Error from "./errors";
import validator from 'validator';
import Mailer from "../routes/mailer";
import totp from 'otplib/totp';
import uuidv4 from "uuid/v4";
import * as jwt from "jsonwebtoken";
import * as fs from "fs";

totp.options = {crypto, step: 5 * 60};//Step is in seconds

const secret = Functions.getConfig('session.security').secret;

Array.prototype.isEmpty = function () {
    return this.length <= 0;
};

export default class User {

    mailer = new Mailer();

    /**
     * LOGIN with Email
     * @param email
     * @param password
     * @returns {Promise<any>}
     */
    emailAuthenticate(email, password) {
        const self = this;
        return new Promise((resolve, reject) => {

            const error = [];
            if (email === null) {
                error.push({email: "Invalid email specified"});
            }
            if (password === null) {
                error.push({"password": "Password empty or invalid"});
            }

            if (!error.isEmpty()) {
                reject(Error.errorResponse(Error.INVALID_DATA, error));
                return;
            }
            const dbInterface = new Database();
            dbInterface.select("users", {email: email}, function (err, res) {
                const now = (new Date()).getTime();
                if (res.length > 0) {

                    const user = res[0];
                    const unknownPassword = Functions.sha512(password, user.salt);

                    //If hash generated matches - correct password
                    if (unknownPassword.passwordHash === user.passwordHash) {
                        console.log('Password match');
                        switch (user.status) {
                            case "activated": {
                                console.log('Setting up 2FA');
                                self
                                    .generateOTP(dbInterface, user)
                                    .then(hashToken => {
                                        console.log('2FA Sent');
                                        resolve(Error.successError("Confirm login with OTP", {token: hashToken}))
                                    })
                                    .catch(reason => {
                                        console.log(reason);
                                        reject(Error.LOGIN_FAILED)
                                    })
                                    .finally(() => {
                                        dbInterface.close();
                                    });

                                break;
                            }
                            case "pending": {
                                console.error(`Account not activated`);
                                reject(Error.ACCOUNT_NOT_ACTIVATED);
                                break;
                            }
                            case "blocked":
                            default: {
                                console.error(`Account blocked`);
                                reject(Error.ACCOUNT_BLOCKED);
                            }
                        }
                    } else {
                        console.error(`Incorrect password provided for -> ${email}`);
                        reject(Error.ACCOUNT_INCORRECT_PASSWORD)
                    }
                } else {
                    console.error(`User account not found -> ${email}`);
                    reject(Error.ACCOUNT_NOT_FOUND);
                }
            });
        });
    }

    /**
     * GENERATE OTP
     * @param dbInterface
     * @param user
     * @returns {Promise<T | never>}
     */
    generateOTP(dbInterface, user) {
        console.log('Generating OTP');

        const tokenSecret = uuidv4();
        const otp = totp.generate(tokenSecret);
        //Token can be used to generate another OTP
        const hashToken = Functions.sha512(tokenSecret, user.salt);
        const self = this;

        //Store the tokenSecret for use later
        return dbInterface
            .update("users", {id: user.id}, {
                hashToken: hashToken.passwordHash,
                tokenSecret: tokenSecret,
                updated_on: new Date().toISOString()
            })
            .then(value => {
                self.sendOTPEmail(user, otp);
                console.log(`OTP Generated -> ${hashToken.passwordHash}`);
                return Promise.resolve(hashToken.passwordHash);
            })
            .catch(reason => {
                console.log("OTP could not be generated");
                return Promise.reject(Error.NOT_UPDATED);
            });
    }

    /**
     * SEND OTP EMAIL
     * @param user
     * @param otp
     */
    sendOTPEmail(user, otp) {
        const from = `CryptoManager <${this.mailer.options.auth.user}>`;
        const mailSubject = "CryptoManager OTP";
        const mailBody =
            `Dear ${user.name},<br/>
            Kindly login using this OTP code to login <br/>
            <h1>${otp}</h1>
            <br/>
            Best Regards,<br/>
            CryptoManager`;

        console.log('Sending registration email');
        this.mailer.sendMail(from, user.email, mailSubject, mailBody, [], function (resp) {
            console.log('Mail status: %s', JSON.stringify(resp));
            if (resp.error) {
                console.log(resp.error);
            }
            console.log('Mail sent');
        });
    }

    /**
     * RESEND OTP
     * @param hashToken
     * @returns {Promise<any>}
     */
    resendOTP(hashToken) {
        return new Promise((resolve, reject) => {
            const error = [];
            if (Functions.isNull(hashToken)) {
                error.push({token: "token not set"});
            }
            if (!error.isEmpty()) {
                reject(Error.errorResponse(Error.INVALID_DATA, error));
            } else {

                const db = new Database();

                console.log(`Searching for user with matching hashToken -> ${hashToken}`);
                db
                    .select("users", {hashToken})
                    .then(users => {
                        const user = users[0];
                        return this.generateOTP(db, user);
                    })
                    .then(hash => {
                        resolve(Error.successError("Confirm login with OTP", {token: hash}))
                    })
                    .catch(reason => {
                        reject(Error.LOGIN_FAILED);
                    })
                    .finally(() => {
                        db.close();
                    });
            }
        });
    }

    socialAuthenticate(provider, accountType, params, successCallback, errorCallback) {
        //todo: Social Authenticate
    }

    userLogout(jwtid, uid, callback) {
        const dbInterface = new Database();
        dbInterface.select("auth", {jwtid, uid}, function (err, res) {
            if (res.length > 0) {
                dbInterface.update("auth", {jwtid, uid}, {status: 0}, function (err, resp) {
                    if (typeof callback === 'function') callback(err);
                });
            } else {
                if (typeof callback === 'function') callback(err);
            }
            dbInterface.close();
        });
    }

    updateInfo(uid, params) {
        const db = new Database();

        //Remove sensitive data
        delete params["passwordHash"];
        delete params["salt"];
        delete params["created_on"];
        delete params["updated_on"];
        delete params["status"];
        delete params["activation_code"];
        delete params["hashToken"];
        delete params["tokenSecret"];

        params["updated_on"] = new Date().toISOString();

        return db
            .update("users", {uid}, params)
            .then(value => {
                return Promise.resolve(Error.successError("Account updated"))
            });
    }

    requestPasswordReset(email, successCallback, errorCallback) {
        var request = new functions.httpRequest();
        request.addOption("path", "/authenticate/user/reset/password");

        request.post({email: email}, function (res) {
            switch (res.error) {
                case 200:
                    if (typeof successCallback === 'function') successCallback(res);
                    break;
                default:
                    if (typeof errorCallback === 'function') errorCallback(res);
                    break;
            }
        }, function (err) {
            if (typeof errorCallback === 'function') errorCallback(err);
        });
    }

    updatePassword(secureToken, params, successCallback, errorCallback) {
        var request = new functions.httpRequest();
        request.addHeader("Authorization", "Bearer " + secureToken);
        request.addOption("path", "/api/accounts/user/password/change");

        request.post(params, function (res) {
            switch (res.error) {
                case 200:
                    if (typeof successCallback === 'function') successCallback(res);
                    break;
                default:
                    if (typeof errorCallback === 'function') errorCallback(res);
                    break;
            }
        }, function (err) {
            if (typeof errorCallback === 'function') errorCallback(err);
        });
    }

    createAccount(email, password, name, phonenumber) {
        const errors = [];
        if (Functions.isNull(name)) {
            errors.push({name: 'Name is invalid'})
        }
        if (Functions.isNull(email)) {
            errors.push({email: "Email is invalid"});
        }
        if (Functions.isNull(phonenumber) || !validator.isMobilePhone(phonenumber, ['en-US', "en-GB", "en-NG"])) {
            errors.push({phonenumber: "Phonenumber is invalid"})
        }
        if (Functions.isNull(password)) {
            errors.push({password: "Password is not valid"});
        }

        if (!errors.isEmpty()) {
            return Promise.reject(Error.errorResponse(Error.INVALID_DATA, errors));
        }

        const dbInterface = new Database();
        const activation_code = Functions.genRandomString(32);
        //Check if email exists
        return new Promise((resolve, reject) => {
            dbInterface
                .select("users", {email: email, phonenumber: phonenumber})
                .then(value => {
                    if (value.length > 0) {
                        //Account already exists
                        console.error("User already exists");
                        return Promise.reject(Error.ACCOUNT_EXISTS);
                    } else {
                        //hash password
                        const {salt, passwordHash} = Functions.saltHashPassword(password);

                        const data = {
                            uid: uuidv4(),
                            name,
                            email,
                            phonenumber,
                            salt,
                            passwordHash,
                            created_on: new Date().toISOString(),
                            status: "pending",
                            activation_code
                        };
                        //Create user account
                        console.log(`Creating user -> {email:${email}`);
                        return dbInterface.insert("users", data)
                    }
                })
                .then(res => {
                    console.log(`Account created successfully`);

                    const from = `Support <${this.mailer.options.auth.user}>`;
                    const mailSubject = "Welcome To CryptoManager";
                    const url = `${Functions.getConfig('base_url')}api/activate?code=${activation_code}`;
                    const mailBody = `
                    Welcome ${name},<br/>
                    Kindly activate your account using this link ${url}<br/>
                    Best Regards,<br/>
                    Manager, CryptoManager
                    `;

                    console.log('Sending registration email');
                    this.mailer.sendMail(from, email, mailSubject, mailBody, [], function (resp) {
                        console.log('Mail status: %s', JSON.stringify(resp));
                        if (resp.error) {
                            console.log(resp.error);
                        }
                        console.log('Mail sent');
                    });

                    resolve(Error.successError("User account created"))
                })
                .catch(reason => {
                    reject(reason);
                })
                .finally(() => {
                    dbInterface.close();
                });
        });
    }

    activateAccount(code) {
        const errors = [];
        if (Functions.isNull(code)) {
            errors.push({code: "Code is not present"})
        }

        if (!errors.isEmpty()) {
            return Promise.reject(Error.errorResponse(Error.INVALID_DATA, errors));
        }
        const dbInterface = new Database();

        return new Promise((resolve, reject) => {
            console.log(`Find user that match -> {code: ${code}}`);
            dbInterface
                .select("users", {activation_code: code})
                .then(users => {
                    const user = users[0];
                    console.log(`Updating user -> ${user.id}`);
                    return new Promise((updateResolve, updateReject) => {
                        //Enable account and clear activation_code
                        dbInterface
                            .update("users", {id: user.id}, {
                                activation_code: "",
                                status: "activated",
                                updated_on: new Date().toISOString()
                            })
                            .then(value => {
                                updateResolve(user);
                            })
                            .catch(reason => {
                                updateReject(Error.ACCOUNT_NOT_ACTIVATED);
                            });
                    });
                })
                .then((user) => {
                    console.log(`User account updated`);

                    const from = `Support <${this.mailer.options.auth.user}>`;
                    const mailSubject = "Get Started on CryptoManager";
                    const mailBody = `
                    Welcome ${user.name},<br/>
                    You can sign in to your account and create multiple wallets<br/>
                    Best Regards,<br/>
                    Manager, CryptoManager
                    `;

                    console.log('Sending activation email');
                    this.mailer.sendMail(from, user.email, mailSubject, mailBody, [], function (resp) {
                        console.log('Mail status: %s', JSON.stringify(resp));
                        if (resp.error) {
                            console.log(resp.error);
                        }
                        console.log('Mail sent');
                    });

                    resolve(Error.successError("User account activated"))
                })
                .catch(reason => {
                    reject(reason);
                })
                .finally(reason => {
                    dbInterface.close();
                })
        });
    }

    confirm2FA(otp, token) {
        return new Promise((resolve, reject) => {
            const error = [];
            if (Functions.isNull(token)) {
                error.push({token: "token not set"});
            }
            if (Functions.isNull(otp)) {
                error.push({otp: "otp not set"});
            }

            if (!error.isEmpty()) {
                reject(Error.errorResponse(Error.INVALID_DATA, error));
            } else {
                const db = new Database();
                console.log(`Searching for user with matching hashToken -> ${token}`);
                db
                    .select("users", {hashToken: token})
                    .then(users => {
                        const user = users[0];

                        console.log(user);

                        //Checking otp is valid
                        if (totp.check(otp, user.tokenSecret)) {
                            console.log('OTP was valid');

                            //Generate JWT token
                            const JWTSignOptions = {
                                algorithm: 'RS256',
                                issuer: "cryptomanager",
                                jwtid: uuidv4(),
                                expiresIn: "2 days"
                            };

                            const jwtToken = jwt.sign({
                                uid: user.uid,
                                type: user
                            }, fs.readFileSync(Functions.getConfig('session.security').privatekey, 'utf8'), JWTSignOptions)
                            console.log(`Signed JWT-Token`);
                            //Log token so it can be revoked later if necessary
                            return db
                                .insert("auth", {
                                    uid: user.uid,
                                    jwtid: JWTSignOptions.jwtid,
                                    issuer: JWTSignOptions.issuer,
                                    status: 1,
                                    created_on: new Date().toISOString()
                                })
                                .then(value => {
                                    //House keeping
                                    console.log("House-keeping");
                                    return db.update("users", {id: user.id}, {
                                        hashToken: "",
                                        tokenSecret: "",
                                        updated_on: new Date().toISOString()
                                    })
                                })
                                .then(value => {
                                    return Promise.resolve({jwtToken});
                                })
                                .catch(reason => {
                                    return Promise.reject(reason)
                                });
                        } else {
                            console.error('Incorrect OTP');
                            return Promise.reject(Error.INCORRECT_OTP);
                        }
                    })
                    .then(hash => {
                        resolve(Error.successError("Logged In. Add JWT to Header as `Authorization: Bearer {token}`", {token: hash}))
                    })
                    .catch(reason => {
                        console.log(reason);
                        if (reason === Error.NOT_CREATED) {
                            reject(Error.LOGIN_FAILED);
                        } else {
                            reject(reason);
                        }
                    })
                    .finally(() => {
                        db.close();
                    });
            }
        });
    }

    getRevokedToken(issuer, tokenId, cb) {
        const db = new Database();
        console.log(`Checking if token is active -> ${issuer}::${tokenId}`);
        db.select("auth", {issuer: issuer, jwtid: tokenId})
            .then(result => {
                if (result[0].status === 0) {
                    console.log(`Token has been disabled -> ${tokenId}`);
                } else {
                    console.log(`Token still active -> ${tokenId}`);
                }
                cb(null, result[0].status === 0)
            })
            .catch(reason => {
                cb(reason);
            })
            .finally(() => {
                db.close();
            });
    }
}