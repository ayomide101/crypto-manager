export default class HttpRequest {

    http;

    /**
     * HTTP REQUEST CLASS
     * make http request calls to global API
     */
    constructor(options) {
        var http;
        if (arguments.length < 1) {
            options = getConfig('http.request');
        }
        if (options.secure) {
            this.http = require('https');
            options.port = 443;
        } else {
            this.http = require('http');
        }
        this.options = options;

    }

    request(method, params, successCallback, errorCallback) {
        var options = this.options;
        options.method = method;

        params = JSON.stringify(params);
        if (!this.options.hasOwnProperty("headers"))
            this.options.headers = {};
        // options.headers['Content-Type'] = 'application/json';
        options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        options.headers['Content-Length'] = Buffer.byteLength(params);

        var request = this.http.request(options, function (res) {
            // res.setEncoding('utf8');
            var response = "";
            res.on('data', function (chunk) {
                response += chunk;
            });
            res.on('end', function () {
                try {
                    response = JSON.parse(response);
                } catch (e) {
                }
                successCallback(response);
            });
        }).on('error', function (e) {
            errorCallback(e);
        });
        // write data to request body
        request.write(params);
        request.end();
    }

    addHeader(key, value) {
        if (!this.options.hasOwnProperty("headers")) {
            this.options.headers = {};
        }
        this.options.headers[key] = value;
    }

    addOption(key, value) {
        this.options[key] = value;
    }

    post(params, successCallback, errorCallback) {
        this.request('POST', params, successCallback, errorCallback);
    }

    get(params, successCallback, errorCallback) {
        this.request('GET', params, successCallback, errorCallback);
    }

    getUrl(url) {
        return new Promise((resolve, reject) => {
            this.http.get(url, (res) => {
                let response = "";
                res.on('data', function (chunk) {
                    response += chunk;
                });
                res.on('end', function () {
                    try {
                        response = JSON.parse(response);
                    } catch (e) {
                    }
                    resolve(response);
                });
            }).on("error", (err) => {
                reject(err);
                console.log("Error: " + err.message);
            });
        });
    }

    setOptions(options) {
        this.options = options;
    }
}