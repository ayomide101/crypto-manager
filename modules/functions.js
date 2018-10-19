/**
 * GET DATA FROM CONFIG
 * get data from the config file <app-config.json> located in root directory
 * @param config - specify the configuration to get, default gets a config
 */
var getConfig = function (config){
    var path = process.env.ENVIRONMENT === 'production' ? '../app-production.json':'../app-config.json';
    var appConfig = require(path);

    if(arguments.length > 0){
		return appConfig[config];
	} else {
		return appConfig;
	}
};

var numberFormat = function(number, decimal){
    decimal = isNaN(decimal = Math.abs(decimal)) ? 2 : decimal;
    var d = ".",t = ",";
    var s = number < 0 ? "-" : "",
        i = String(parseInt(number = Math.abs(Number(number) || 0).toFixed(decimal))),
        j = (j = i.length) > 3 ? j % 3 : 0;
    return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "1" + t) + (decimal ? d + Math.abs(number - i).toFixed(decimal).slice(2) : "");
};

var timestampToDate = function(unix_timestamp){
	var date = new Date(unix_timestamp);
	var day = date.getDate();
	var month = date.getMonth();
    var year = date.getFullYear();
	var hours = date.getHours();
	var minutes = "0" + date.getMinutes();

	var n = hours/12;hours = hours%12;
	return day+"/"+month+"/"+year+" "+(hours == 0 ? "12" : hours)+":"+minutes.substr(-2)+(n > 0 ? "pm" : "am");
};

/**
 * RENDER HTTP RESPONSE
 * use dispatch instead
 * callback to render response based on user authentication(login) status
 * @deprecated
 */
var render = function(view_component, loggedIn, userDetails, template_properties, req, res, next){
	if(loggedIn){
		template_properties.loggedIn = true;
	} else {
		template_properties.notLoggedIn = true;
	}
	res.render(view_component, template_properties);
	next();
};

/**
 * RENDER HTTP RESPONSE
 * check user authentication(login) and render response based on login status
 */
var dispatch = function(view_component, template_properties, req, res){
    var users = require('./user-account');
    var sessionId = require('./functions').getConfig('session.security').name;
	users.checkLoggedIn(req.cookies[sessionId], function(loggedIn, status){
        template_properties.notLoggedIn = true;
		if(loggedIn){
            users.resetTimeoutCount(req.cookies[sessionId]);
            template_properties.loggedIn = true;
            template_properties.notLoggedIn = false;
		}
        console.log(view_component);
		res.render(view_component, template_properties);
	});
};

/**
 * HTTP REQUEST CLASS
 * make http request calls to global API
 */
var httpRequest = function(options){
    var http;
	if(arguments.length < 1){
		options = getConfig('http.request');
	}
    if (options.secure) {
        http = require('https');
        options.port = 443;
    } else {
        http = require('http');
    }
	this.options = options;

	this.setOptions = function(options){
		this.options = options;
	};

	this.addOption = function(key, value){
		this.options[key] = value;
	};

	this.addHeader = function(key, value){
		if(!this.options.hasOwnProperty("headers")){
			this.options.headers = {};
		}
		this.options.headers[key] = value;
	};

	this.get = function(params, successCallback, errorCallback){
		this.request('GET', params, successCallback, errorCallback);
	};

	this.post = function(params, successCallback, errorCallback){
		this.request('POST', params, successCallback, errorCallback);
	};

	this.request = function(method, params, successCallback, errorCallback){
		var options = this.options;
		options.method = method;

        params = JSON.stringify(params);
        if(!this.options.hasOwnProperty("headers"))
            this.options.headers = {};
        // options.headers['Content-Type'] = 'application/json';
        options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        options.headers['Content-Length'] = Buffer.byteLength(params);

		var request = http.request(options, function(res) {
			// res.setEncoding('utf8');
			var response = "";
			res.on('data', function (chunk) {
                response += chunk;
			});
			res.on('end', function(){
                try{
                    response = JSON.parse(response);
                } catch (e){}
                successCallback(response);
			});
		}).on('error', function(e) {
			errorCallback(e);
		});
		// write data to request body
		request.write(params);
		request.end();
	};
};

/**
 * DATABASE INTERFACE CLASS
 * interface class to query database
 * utilizes configurations specified in app-config.json
 * @param config parse config object to override default
 */
var database = function(config){
	if(arguments.length < 1){
		config = getConfig('db.config');
	}
	this.options = config;

	var connection = require('mysql').createConnection(config);
	connection.connect(function(err){
		if(err){
			console.log(err);
			throw err;
		}
	});

	this.select = function(table, params, keyword, operator, orderby, mode, limit, callback){
		switch(arguments.length){
			case 1:
				params = {};keyword = 'AND';operator = '=';orderby = '';mode = '';limit = 0;callback = null;
				break;
			case 2:
				keyword = 'AND';operator = '=';orderby = '';mode = '';limit = 0;callback = null;
				break;
			case 3:
				operator = '=';orderby = '';mode = '';limit = 0;callback = null;
				if(typeof keyword == 'function'){
					callback = keyword;
					keyword = 'AND';
				}
				break;
			case 4:
				orderby = '';mode = '';limit = 0;callback = null;
				break;
			case 5:
				mode = '';limit = 0;callback = null;
				break;
			case 6:
				limit = 0;callback = null;
				break;
			case 7:
				callback = null;
				break;
		}

		var suffix = '';
		var values = [];
		for(var param in params){
			if(suffix.trim() != '') suffix += ' '+keyword+' ';
			suffix += '??'+operator+'?';
			values[values.length] = param;
			values[values.length] = params[param];
		}

		var sql = 'SELECT * FROM '+table+((suffix.trim() != '') ? ' WHERE '+suffix : '');

		if(orderby && orderby.trim() != ''){
			sql += ' ORDER BY '+orderby;
			if (mode && mode.trim() != '') {
				sql += ' '+mode;
			}
		}
		if(!isNaN(limit) && limit > 0){
			sql += ' LIMIT '+limit;
		}

		return connection.query(sql, values, function(err, res) {
			if(err){
				throw err;
			}
			if(typeof callback == 'function') callback(err, res);
		});
	};

	this.insert = function(table, params, callback){
		switch(arguments.length){
			case 1:
				params = {};callback = null;
				break;
			case 2:
				callback = null;
				break;
		}

		var sql = 'INSERT INTO '+table+' SET ?';
		return connection.query(sql, params, function(err, res){
			if(err){
				throw err;
			}
			if(typeof callback == 'function') callback(err, res);
		});
	};

	this.update = function(table, params, values, keyword, operator, callback){
		switch(arguments.length){
			case 1:
				params = {};values = {};keyword = 'AND';operator = '=';callback = null;
				break;
			case 2:
				values = {};keyword = 'AND';operator = '=';callback = null;
				break;
			case 3:
				keyword = 'AND';operator = '=';callback = null;
				break;
			case 4:
				operator = '=';callback = null;
				if(typeof keyword == 'function'){
					callback = keyword;
					keyword = 'AND';
				}
				break;
			case 5:
				callback = null;
				break;
		}

		var n = 0;
		for(var value in values){
			n++;
		}
		var sql = 'UPDATE '+table+' SET ?'+((n > 0) ? ' WHERE ?' : '');
		return connection.query(sql, [values, params], function(err, res){
			if(err){
				throw err;
			}
			if(typeof callback == 'function') callback(err, res);
		});
	};

	this.delete = function(table, params, keyword, operator, callback){
		switch(arguments.length){
			case 1:
				params = {};keyword = 'AND';operator = '=';callback = null;
				break;
			case 2:
				keyword = 'AND';operator = '=';callback = null;
				break;
			case 3:
				operator = '=';callback = null;
				if(typeof keyword == 'function'){
					callback = keyword;
					keyword = 'AND';
				}
				break;
			case 4:
				callback = null;
				if(typeof operator == 'function'){
					callback = operator;
					operator = '=';
				}
				break;
		}

		var suffix = '';
		var values = [];
		for(var param in params){
			if(suffix.trim() != '') suffix += ' '+keyword+' ';
			suffix += '??'+operator+'?';
			values[values.length] = param;
			values[values.length] = params[param];
		}

		var sql = 'DELETE FROM '+table+((suffix.trim() != '') ? ' WHERE '+suffix : '');
		return connection.query(sql, values, function(err, res){
			if(err){
				throw err;
			}
			if(typeof callback === 'function') callback(err, res);
		});
	};

	this.query = function(sql, callback){
		return connection.query(sql, function(err, res){
			if(err){
				throw err;
			}
			if(typeof callback === 'function') callback(err, res);
		});
	};

	this.close = function(){
		connection.end();
	};
};

module.exports = {
	/**
	 * @deprecated
	 * use dispatch instead
	 */
	render: render,
	getConfig: getConfig,
	dispatch: dispatch,
	httpRequest: httpRequest,
	database : database,
    numberFormat : numberFormat,
    timestampToDate : timestampToDate
};