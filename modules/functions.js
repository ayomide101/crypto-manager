import crypto from "crypto";
import * as QuickEncrypt from "quick-encrypt";
import * as fs from "fs";

export default class Functions {

    /**
     * GET DATA FROM CONFIG
     * get data from the config file <app-config.json> located in root directory
     * @param config - specify the configuration to get, default gets a config
     */
    static getConfig (config) {
        const path = process.env.ENVIRONMENT === 'production' ? '../app-production.json' : '../app-config-sensitive.json';
        const appConfig = require(path);

        if (arguments.length > 0) {
            return appConfig[config];
        } else {
            return appConfig;
        }
    };
    static numberFormat (number, decimal) {
        decimal = isNaN(decimal = Math.abs(decimal)) ? 2 : decimal;
        var d = ".", t = ",";
        var s = number < 0 ? "-" : "",
            i = String(parseInt(number = Math.abs(Number(number) || 0).toFixed(decimal))),
            j = (j = i.length) > 3 ? j % 3 : 0;
        return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "1" + t) + (decimal ? d + Math.abs(number - i).toFixed(decimal).slice(2) : "");
    }
    static timestampToDate (unix_timestamp) {
        const date = new Date(unix_timestamp);
        const day = date.getDate();
        const month = date.getMonth();
        const year = date.getFullYear();
        let hours = date.getHours();
        let minutes = "0" + date.getMinutes();

        const n = hours / 12;
        hours = hours % 12;
        return day + "/" + month + "/" + year + " " + (hours === 0 ? "12" : hours) + ":" + minutes.substr(-2) + (n > 0 ? "pm" : "am");
    };
    /**
     * RENDER HTTP RESPONSE
     * use dispatch instead
     * callback to render response based on user authentication(login) status
     * @deprecated
     */
    static render (view_component, loggedIn, userDetails, template_properties, req, res, next) {
        if (loggedIn) {
            template_properties.loggedIn = true;
        } else {
            template_properties.notLoggedIn = true;
        }
        res.render(view_component, template_properties);
        next();
    }

    /**
     * RENDER HTTP RESPONSE
     * check user authentication(login) and render response based on login status
     */
    static dispatch = function (view_component, template_properties, req, res) {
        // const users = new require('./user-account');
        // const sessionId = Functions.getConfig('session.security').name;
        // users.checkLoggedIn(req.cookies[sessionId], function (loggedIn, status) {
            template_properties.notLoggedIn = true;
        //     if (loggedIn) {
        //         users.resetTimeoutCount(req.cookies[sessionId]);
        //         template_properties.loggedIn = false;
        //         template_properties.notLoggedIn = true;
            // }
            res.render(view_component, template_properties);
        // });
    };

    /**
     * generates random string of characters i.e salt
     * @function
     * @param {number} length - Length of the random string.
     */
    static genRandomString(length) {
        return crypto.randomBytes(Math.ceil(length / 2))
            .toString('hex') /** convert to hexadecimal format */
            .slice(0, length);
        /** return required number of characters */
    }

    /**
     * hash password with sha512.
     * @function
     * @param {string} password - List of required fields.
     * @param {string} salt - Data to be validated.
     */
    static sha512(password, salt) {
        console.log(password);
        console.log(salt);
        const hash = crypto.createHmac('sha512', salt);
        /** Hashing algorithm sha512 */
        hash.update(password);
        const value = hash.digest('hex');
        return {
            salt: salt,
            passwordHash: value
        };
    };

    static saltHashPassword(userpassword) {
        const salt = Functions.genRandomString(16);
        /** Gives us salt of length 16 */
        // console.log('UserPassword = ' + userpassword);
        // // console.log('Passwordhash = ' + passwordHash);
        // console.log('nSalt = ' + salt);
        return Functions.sha512(userpassword, salt);
    }

    static algorithm = 'aes-256-gcm';

    // Part of https://github.com/chris-rock/node-crypto-examples
    static encryptWithIV(text, password, iv) {
        return new Promise((resolve, reject) => {
            try {
                const cipher = crypto.createCipheriv(Functions.algorithm, password, iv);
                let encrypted = cipher.update(text, 'utf8', 'hex');
                encrypted += cipher.final('hex');
                const tag = cipher.getAuthTag();
                resolve(encrypted+"/"+tag.toString('hex'));
            } catch (e) {
                reject(e);
            }
        });
    }

    static decryptWithIV(encrypted, password, iv) {
        return new Promise((resolve, reject) => {
            try {
                const decipher = crypto.createDecipheriv(Functions.algorithm, password, iv);
                const broken = encrypted.split("/");
                const tag = Buffer.from(broken[1], 'hex');
                const content = broken[0];

                decipher.setAuthTag(tag);

                let dec = decipher.update(content, 'hex', 'utf8');
                dec += decipher.final('utf8');
                resolve(dec);
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Encrypt file with public key
     * @param data
     * @returns {Promise<any>}
     */
    static encryptWithPublicKey(data) {
        return new Promise((resolve, reject) => {
            try {
                let publicKey = fs.readFileSync(Functions.getConfig('session.security').publickey, 'utf8');
                resolve(QuickEncrypt.encrypt(data, publicKey));
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Decrypt with private key
     * @param data
     * @returns {Promise<any>}
     */
    static decryptWithPrivateKey(data) {
        return new Promise((resolve, reject) => {
            try {
                let privateKey = fs.readFileSync(Functions.getConfig('session.security').privatekey, 'utf8');
                resolve(QuickEncrypt.decrypt(data, privateKey));
            } catch (e) {
                reject(e);
            }
        });
    }

    static isNull(da) {
        return da === null || typeof da === "undefined";
    }
}