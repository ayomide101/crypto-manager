var functions = require('./functions');
// var user = require('./user');

var getEstimate = function(pickup, dropoff, sizefit, type, value, successCallback, errorCallback){
    var request = new functions.httpRequest();

    // var params = {pickup_address: pickup, dropoff_address: dropoff, size_fit: sizefit, request_type: type, estimated_value: value};
    var params = {pickup_location: JSON.parse(pickup), estimated_value: value};
    if(type.toLowerCase() == "others" || type.toLowerCase() == "custom"){
        request.addOption("path", "/api/orders/estimate/custom");
        params.pickup_time = 0;
        params.suggestedPrice = value; // fix, not aligned with doc
    } else {
        params.dropoff_location = JSON.parse(dropoff);
        params.size_fit = sizefit;
        params.request_type = type;
        request.addOption("path", "/api/orders/estimate");
    }

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

var paymentMethods = function(secureToken, successCallback, errorCallback){
    var request = new functions.httpRequest();
    request.addHeader("Authorization", "Bearer "+secureToken);
    request.addOption("path", "/api/payments/methods");
    request.get({}, function(res){
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

var getHistory = function(secureToken, successCallback, errorCallback){
    var request = new functions.httpRequest();
    request.addHeader("Authorization", "Bearer "+secureToken);
    request.addOption("path", "/api/orders/history?status=pending|completed");
    // request.addOption("path", "/api/orders/history?status=completed");
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

var getOrderDetails = function(order_id, secureToken, successCallback, errorCallback){
    var request = new functions.httpRequest();
    request.addHeader("Authorization", "Bearer "+secureToken);
    request.addOption("path", "/api/orders/"+order_id);
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

var placeDispatchRequest = function(secureToken, pickup, dropoff, size_fit, pickup_info, recipient_info, description, value_of_item, successCallback, errorCallback){
    var request = new functions.httpRequest();
    request.addHeader("Authorization", "Bearer "+secureToken);
    request.addOption("path", "/api/orders/place/dispatch");
    var params = {
        pickup_location: pickup,
        dropoff_location: dropoff,
        size_fit: size_fit,
        pickup_name: pickup_info.name,
        pickup_phonenumber: pickup_info.phonenumber,
        recipient_name: recipient_info.name,
        recipient_phonenumber: recipient_info.phonenumber,
        item_type: "others",
        description: description,
        delivery_type: "regular",
        value_of_item: value_of_item
    };

    try{
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
    } catch(err){
        errorCallback(err);
    }
};

var placeShoppingRequest = function(type, secureToken, pickup, dropoff, size_fit, recipient_name, recipient_number, description, items, successCallback, errorCallback){
    var request = new functions.httpRequest();
    request.addHeader("Authorization", "Bearer "+secureToken);
    request.addOption("path", "/api/orders/place/"+type);

    var value_of_items = 0;
    if(typeof items !== "undefined" && items != null)
        for(var i=0; i<items.length; i++){
            value_of_items += items[i].amount;
        }

    var params = {
        pickup_location: pickup,
        dropoff_location: dropoff,
        size_fit: size_fit,
        recipient_name: recipient_name,
        recipient_phonenumber: recipient_number,
        description: description,
        delivery_type: "regular",
        value_of_item: value_of_items
    };

    try{
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
    } catch(err){
        errorCallback(err);
    }
};

var placeCustomRequest = function(secureToken, pickup, description, suggestedPrice, request_time, successCallback, errorCallback){
    var request = new functions.httpRequest();
    request.addHeader("Authorization", "Bearer "+secureToken);
    request.addOption("path", "/api/orders/place/custom");
    var params = {
        pickup_location: pickup,
        description: description,
        pickup_time: request_time,
        delivery_type: "regular",
        // suggested_price: suggestedPrice,
        suggestedPrice: suggestedPrice, // fix, not aligned with doc
        value_of_item: suggestedPrice
        // suggestedPrice: suggestedPrice,
        // value_of_item: 0
    };

    try{
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
    } catch(err){
        errorCallback(err);
    }
};

var getPaymentPage = function(secureToken, paymentRef, successCallback, errorCallback){
    var request = new functions.httpRequest();
    request.addHeader("Authorization", "Bearer "+secureToken);
    request.addOption("path", "/api/payments/"+paymentRef+"/pay");
    try{
        request.get({}, function(res){
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
    } catch (err){
        errorCallback(err);
    }
};

module.exports = {
    getEstimate: getEstimate,
    getHistory: getHistory,
    getOrderDetails: getOrderDetails,
    paymentMethods: paymentMethods,
    placeDispatchRequest: placeDispatchRequest,
    placeShoppingRequest: placeShoppingRequest,
    placeCustomRequest: placeCustomRequest,
    getPaymentPage: getPaymentPage
};