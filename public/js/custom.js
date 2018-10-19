/**
 * Created by Ayomide on 28/12/2016.
 */

var port = window.location.port; port = (port.trim().length != '') ? ':'+port : '';
var apiUrl = window.location.protocol+'//'+window.location.hostname+port+'/api/';
// var apiUrl = "https://business.cryptomanager.com/api/";

/*** Redirect to start on reload ***/
// location.href = "#/";

// var showLoading = function(showLoader){
//     if(showLoader){
//         $("#loading").show();
//     } else {
//         $("#loading").hide();
//     }
// };

var overlays = {
    showScreen: function(screen){
        this.hideAll();
        $("#"+screen).show();
    },
    hideAll: function(){
        $("#login-screen").hide();
        $("#splash-screen").hide();
        $("#register-screen").hide();
        $("#no-connection-screen").hide();
    }
};

var toast = function(message, status, duration){
    var timeout = (arguments.length > 2) ? duration : 7000;
    if(status === "success"){
        message = "<i class=icon-ok-sign></i> "+message;
    } else if(status === "error"){
        message = "<i class=icon-remove-sign></i> "+message;
    }
    SEMICOLON.widget.notifications({
        "data-notify-type": status,
        "data-notify-msg": message,
        "data-notify-timeout": timeout
    });
};

var userLogin = function(successCallback, errorCallback){
    $.post(apiUrl+"login", {email: $("#login-email").val(), password: $("#login-password").val()}, function(result){
        successCallback(result);
    }, 'json').fail(function(err){
        errorCallback(err)
    });
};

$("#login-form").submit(function(event){
    event.preventDefault();

    var submitButton = $("#login-submit");
    $(submitButton).html("Loading...");
    $(submitButton).prop("disabled", true);

    var errorFunc = function(message){
        toast(message, "error", 7000);
        $(submitButton).html("Login");
        $(submitButton).prop("disabled", false);
    };

    userLogin(function(result){
        switch(result.error){
            case 200:
                toast("Login Successful", "success", 2000);
                setTimeout(function(){
                    $.get(apiUrl+"user/profile", {}, function(resp){
                        console.log(resp);
                        switch (resp.error){
                            case 200:
                                localStorage.setItem("profile", JSON.stringify(resp.data));
                                location.reload(false);
                                break;
                            default:
                                errorFunc(resp.message);
                                break;
                        }
                    }, 'json').fail(function(err){
                        console.log(err);
                        errorFunc("Login failed. Check connection");
                    });
                }, 600);
                break;
            default:
                var message = (result.message && result.message != "undefined") ? result.message : "Login failed. Check connection";
                errorFunc(message);
                break;
        }
    }, function(err){
        console.log(err);
        errorFunc("Login failed. Check connection");
    });
});

var updateProfile = function(params){
    var submitButton = "#profile-submit";
    $(submitButton).html("Updating...");
    $(submitButton).prop("disabled", true);

    $.post(apiUrl+"user/update/info", params, function(result){
        switch(result.error){
            case 200:
                $.get(apiUrl+"user/profile", {}, function(resp){
                    console.log(resp);
                    switch (resp.error){
                        case 200:
                            toast("Profile Updated", "success", 7000);
                            $(submitButton).html("Save Changes");
                            $(submitButton).prop("disabled", false);
                            localStorage.setItem("profile", JSON.stringify(resp.data));
                            break;
                        default:
                            var message = (result.message && result.message != "undefined") ? result.message : "Update failed. Check connection";
                            toast(message, "error", 7000);
                            $(submitButton).html("Save Changes");
                            $(submitButton).prop("disabled", false);
                            break;
                    }
                }, 'json').fail(function(err){
                    console.log(err);
                    toast("Update failed. Check connection", "error", 7000);
                    $(submitButton).html("Save Changes");
                    $(submitButton).prop("disabled", false);
                });
                break;
            default:
                var message = (result.message && result.message != "undefined") ? result.message : "Update failed. Check connection";
                toast(message, "error", 7000);
                $(submitButton).html("Save Changes");
                $(submitButton).prop("disabled", false);
                break;
        }
    }, 'json').fail(function(err){
        console.log(err);
        toast("Update failed. Check connection", "error", 7000);
        $(submitButton).html("Save Changes");
        $(submitButton).prop("disabled", false);
    });
};

var showHistoryLoading = function(showHistoryLoader){
    if(showHistoryLoader){
        $("#history-loading").show();
    } else {
        $("#history-loading").hide();
    }
};

var getOrderDetails = function(order_id, requestUrl){
    showHistoryLoading(true);
    var modal = '#modal-history';
    if($(modal).hasClass('in') || (typeof $(modal).data('bs.modal').isShown !== "undefined" && !$(modal).data('bs.modal').isShown)){
        $(modal).modal('show');
    }
    console.log(requestUrl+"?order_id="+order_id);
    $.get(requestUrl+"?order_id="+order_id, function(resp){
        $("#request-history").html(resp);
        showHistoryLoading(false);
    });
};

var numberFormat = function(number, decimal){
    decimal = isNaN(decimal = Math.abs(decimal)) ? 2 : decimal;
    var d = ".", t = ",";
    var s = number < 0 ? "-" : "",
        i = String(parseInt(number = Math.abs(Number(number) || 0).toFixed(decimal))),
        j = (j = i.length) > 3 ? j % 3 : 0;
    return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "1" + t) + (decimal ? d + Math.abs(number - i).toFixed(decimal).slice(2) : "");
};

var wordsToUpper = function(str) {
    return str.replace(/\w+/g, function(a){
        return a.charAt(0).toUpperCase() + a.slice(1).toLowerCase()
    });
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

var autoCompleteOptions = {
    componentRestrictions: {
        country: 'ng'
    }
};

// var restrictToRegion = function(autocomplete, region){
//     var place = autocomplete.getPlace();
//     if(!place.geometry){return;}
//     if(place.geometry.viewport){
//         autocomplete.setBounds(place.geometry.viewport);
//     }
// };

$(document).ready(function(){
    var reconnectButton = "#reconnect";
    $(reconnectButton).click(function () {
        $(reconnectButton).html("Connecting...");
        $(reconnectButton).prop("disabled", true);
        $.get(apiUrl+"login/status", {}, function(resp){
            console.log(resp);
            location.reload(false);
        }, 'json').fail(function(err){
            console.log(err);
            toast("Network Error. Check connection", "error", 7000);
            $(reconnectButton).html("Try Again");
            $(reconnectButton).prop("disabled", false);
        });
    });
});

$(document).ready(function(){
    try{
        var pickup = document.getElementById('estimate-pickup');
        var dropoff = document.getElementById('estimate-dropoff');

        // This implementation, attaches the lat and long values to the html element
        // so that we can pull that instead of the address
        // no need for extra queries

        var pickupAutoComplete = new google.maps.places.Autocomplete(pickup, autoCompleteOptions);
        pickupAutoComplete.addListener('place_changed', function () {
            console.log('Place found');
            var place = pickupAutoComplete.getPlace();
            //Attach location data to pickup
            $(pickup).attr('data-lat', place.geometry.location.lat());
            $(pickup).attr('data-lng', place.geometry.location.lng());
            //Collect data later on. Don't use address, use lat and long values
        });

        var dropoffAutoComplete = new google.maps.places.Autocomplete(dropoff, autoCompleteOptions);
        dropoffAutoComplete.addListener('place_changed', function () {
            console.log('Place found');
            var place = dropoffAutoComplete.getPlace();
            //Attach location data to pickup
            $(dropoff).attr('data-lat', place.geometry.location.lat());
            $(dropoff).attr('data-lng', place.geometry.location.lng());
            //Collect data later on. Don't use address, use lat and long values
        });
        var attachLocationToPage = function(response) {
            var location = response.loc;
            var lat;
            var lng;

            var useDefault = function () {
                lat = 6.5244;
                lng = 3.3792;
            };

            if (location) {
                var locationArray = location.split(',');
                if (locationArray.length === 2) {
                    lat = locationArray[0];
                    lng = locationArray[1];
                } else {
                    //Use default
                    useDefault();
                }
            } else {
                //attach default
                // 6.5244° N, 3.3792° E Lagos lat and long
                useDefault();
            }
            $('body').attr('data-current-location-lat', lat).attr('data-current-location-lng', lng);
        };

        var states = {
            lagos: "Lagos Nigeria"
        };
        $.get("https://ipinfo.io", function(response) {
            // currentRegion = states[response.region];
            // Attach current location to page for use at later time
            attachLocationToPage(response);
            var currentRegion = states['lagos']; // TODO make dynamic

            console.log(currentRegion);
            // restrictToRegion(estimatePickup, currentRegion);
            // restrictToRegion(estimateDropoff, currentRegion);
        }, "jsonp");
    } catch (err){
        // console.log(err);
    }
});
