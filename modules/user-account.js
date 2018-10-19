var functions = require('./functions');

var emailAuthenticate = function(email, password, successCallback, errorCallback){
	var request = new functions.httpRequest();
	request.addOption("path", "/authenticate/user");

    let data = {email: email, password: password};

    var dbInterface = new functions.database();
    dbInterface.select("users", {email: email}, function(err, res){
        var now = (new Date()).getTime();
        if(res.length > 0 ){
            try{
                var auth_info = JSON.parse(res[0].auth_info);
                if(typeof auth_info.activated_on !== "undefined"){
                    console.log("activation required");
                    callback(true, "pending");
                } else {
                    var status = (typeof auth_info.status !== "undefined" && auth_info.status.toLowerCase() == "active") ? auth_info.status : "unknown";
                    callback(true, status.toLowerCase());
                }
            } catch (e){
                callback(false);
            }
        } else {
            errorCallback("User account not found");
        }
    });

	request.post(, function(res){
		switch(res.error){
			case 200:
				successCallback(res);
				break;
			default:
				errorCallback(res);
				break;
		}
	}, function(err){
		errorCallback(err);
	});
};

var socialAuthenticate = function(provider, accountType, params, successCallback, errorCallback){
    var request = new functions.httpRequest();

    params.source = 'web_app';
    params.provider = provider;
    params.owner_type = accountType;
    params.application_id = functions.getConfig('facebookAppID');

    request.addOption("path", "/authenticate/user/social");
    request.post(params, function(res){
        switch(res.error){
            case 200:
                successCallback(res);
                break;
            default:
                errorCallback(res);
                break;
        }
    }, function(err){
        errorCallback(err);
    });
};

var resetTimeoutCount = function(sessionId){
    var params = {session_id: sessionId};
	var values = {expires_on: ((new Date()).getTime() + functions.getConfig('session.security').session_duration)};

    var database = new functions.database();
    database.update('user_tokens', params, values);
    database.close();
};

var checkLoggedIn = function(sessionId, callback){
	try{
		var dbInterface = new functions.database();
		dbInterface.select("user_tokens", {session_id: sessionId}, function(err, res){
			var now = (new Date()).getTime();
			if(res.length > 0 && res[0].expires_on > now){
                try{
                    var auth_info = JSON.parse(res[0].auth_info);
                    if(typeof auth_info.activated_on !== "undefined"){
                        console.log("activation required");
                        callback(true, "pending");
                    } else {
                    	var status = (typeof auth_info.status !== "undefined" && auth_info.status.toLowerCase() == "active") ? auth_info.status : "unknown";
                        callback(true, status.toLowerCase());
                    }
                } catch (e){
                    callback(false);
				}
			} else {
				callback(false);
			}
		});
		dbInterface.close();
	} catch (err){
		callback(false);
	}
};

var userLogout = function(sessionId, callback){
	var dbInterface = new functions.database();
	dbInterface.select("user_tokens", {session_id: sessionId}, function(err, res){
		if(res.length > 0){
			dbInterface.delete("user_tokens", {session_id: sessionId}, "OR", function(err, resp){
				if(typeof callback == 'function') callback(err);
			});
		} else {
			if(typeof callback == 'function') callback(err);
		}
        dbInterface.close();
	});
	// dbInterface.close();
};

var getAuthDetails = function(sessionId, callback){
    checkLoggedIn(sessionId, function(isLoggedIn){
        if(isLoggedIn){
            var dbInterface = new functions.database();
            dbInterface.select("user_tokens", {session_id: sessionId}, function(err, res){
                callback(err, res);
            });
            dbInterface.close();
        }
    });
};

var getDetails = function(secureToken, successCallback, errorCallback){
	var request = new functions.httpRequest();
	request.addHeader("Authorization", "Bearer "+secureToken);
	request.addOption("path", "/api/accounts/user");

	request.get({}, function(resp){
		switch(resp.error){
			case 200:
                if(typeof successCallback == 'function') successCallback(resp);
				break;
			default:
				if(typeof errorCallback == 'function') errorCallback(resp);
				break;
		}
	}, function(err){
		if(typeof errorCallback == 'function') errorCallback(err);
	});
};

var updateInfo = function(secureToken, userid, params, successCallback, errorCallback){
    var request = new functions.httpRequest();
    request.addHeader("Authorization", "Bearer "+secureToken);
    request.addOption("path", "/api/accounts/user/update/"+userid);

    request.post(params, function(res){
        switch(res.error){
            case 200:
                if(typeof successCallback == 'function') successCallback(res);
                break;
            default:
                if(typeof errorCallback == 'function') errorCallback(res);
                break;
        }
    }, function(err){
        if(typeof errorCallback == 'function') errorCallback(err);
    });
};

var requestPasswordReset = function(email, successCallback, errorCallback){
    var request = new functions.httpRequest();
    request.addOption("path", "/authenticate/user/reset/password");

    request.post({email: email}, function(res){
        switch(res.error){
            case 200:
                if(typeof successCallback == 'function') successCallback(res);
                break;
            default:
                if(typeof errorCallback == 'function') errorCallback(res);
                break;
        }
    }, function(err){
        if(typeof errorCallback == 'function') errorCallback(err);
    });
};

var updatePassword = function(secureToken, params, successCallback, errorCallback){
    var request = new functions.httpRequest();
    request.addHeader("Authorization", "Bearer "+secureToken);
    request.addOption("path", "/api/accounts/user/password/change");

    request.post(params, function(res){
        switch(res.error){
            case 200:
                if(typeof successCallback == 'function') successCallback(res);
                break;
            default:
                if(typeof errorCallback == 'function') errorCallback(res);
                break;
        }
    }, function(err){
        if(typeof errorCallback == 'function') errorCallback(err);
    });
};

var createAccount = function(email, password, fullname, phonenumber, successCallback, errorCallback){
	var request = new functions.httpRequest();
	request.addOption("path", "/authenticate/user/create");

	var params = {
		name: fullname,
		email: email,
	    password: password,
	    phonenumber: phonenumber
	};

    var dbInterface = new functions.database();
    dbInterface.select("users", {email:email, phonenumber: phonenumber}, function(err, res){
        if(res.length > 0){
            dbInterface.delete("user_tokens", {session_id: sessionId}, "OR", function(err, resp){
                if(typeof callback === 'function') callback(err);
            });
        } else {
            if(typeof callback === 'function') callback(err);
        }
        dbInterface.close();
    });

	request.post(params, function(res){
		console.log(res);
		switch(res.error){
			case 200:
				successCallback(res);
				break;
			default:
				errorCallback(res);
				break;
		}
	}, function(err){
		errorCallback(err);
	});
};

var devApps = function(successCallback, errorCallback){
    var request = new functions.httpRequest();
    request.addOption("path", "/api/applications");

    var handleCallback = function (res) {
        switch(res.error){
            case 200:
                successCallback(res);
                break;
            default:
                errorCallback(res);
                break;
        }
    };

    this.create = function(){
        request.post({}, function(res){
            handleCallback(res);
        }, function(err){
            errorCallback(err);
        });
    };

    this.get = function(){
        request.get({}, function(res){
            handleCallback(res);
        }, function(err){
            errorCallback(err);
        });
    };
};

module.exports = {
	emailAuthenticate: emailAuthenticate,
	socialAuthenticate: socialAuthenticate,
	checkLoggedIn: checkLoggedIn,
	userLogout: userLogout,
	createAccount: createAccount,
	getAuthDetails: getAuthDetails,
	getDetails: getDetails,
	updateInfo: updateInfo,
    requestPasswordReset: requestPasswordReset,
    updatePassword: updatePassword,
    resetTimeoutCount: resetTimeoutCount,
    devApps: devApps
};