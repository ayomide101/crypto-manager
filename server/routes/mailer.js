import Functions from "../modules/functions";
import HttpRequest from "../common/httpRequest";

import {createTransport} from "nodemailer";

export default class Mailer {
    /**
     * MAILER CLASS
     * send emails via smtp using nodemailer module
     * utilizes configurations specified in app-config.json
     * @param options parse config object to override default
     */
    constructor(options) {
        if (arguments.length < 1) {
            options = Functions.getConfig('mail.config');
        }
        this.options = options;

        // TODO Add support for attachments

    }

    addOption(key, value) {
        this.options[key] = value;
    }

    /**
     * SEND MAIL TO RECIPIENTS
     * @param fromContent
     * @param recipients
     * @param subject
     * @param body
     * @param attachments
     * @param callback
     */
    sendMail(fromContent, recipients, subject, body, attachments, callback) {
        var options = this.options;
        if (fromContent && fromContent.trim() === "") {
            fromContent = options.auth.user;
        }
        const mailTransporter = createTransport(options);
        const mail = {
            from: fromContent, to: recipients, subject: subject, /* text: 'Hello world?', */ html: body
        };
        mailTransporter.sendMail(mail, function (error, info) {
            callback({error: error, info: info});
        });
    }

    setOptions(options) {
        this.options = options;
    }

    validateCaptcha(captcha, successCallback, errorCallback) {
        const captchaResponse = captcha;
        const captchaSecret = Functions.getConfig('recaptchaSecret');
        const params = {
            secret: captchaSecret,
            response: captchaResponse
        };

        const options = Functions.getConfig('http.request');
        options.host = "www.google.com";
        options.port = 80;
        const request = HttpRequest(options);
        // request.addHeader("Content-type", "application/json; charset=utf-8");
        // request.addOption("path", "/recaptcha/api/siteverify?secret="+recaptchaSecret+"&response="+recaptchaResponse);
        request.addOption("path", "/recaptcha/api/siteverify");
        request.get(params, function (resp) {
            successCallback(resp);
        }, function (err) {
            errorCallback(err);
        });
    }
}