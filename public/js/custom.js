/**
 * Created by Ayomide on 28/12/2016.
 */

var port = window.location.port;
port = (port.trim().length != '') ? ':' + port : '';
var apiUrl = window.location.protocol + '//' + window.location.hostname + port + '';
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
    showScreen: function (screen) {
        this.hideAll();
        $("#" + screen).show();
    },
    hideAll: function () {
        $("#login-screen").hide();
        $("#splash-screen").hide();
        $("#register-screen").hide();
        $("#no-connection-screen").hide();
    }
};

var toast = function (message, status, duration) {
    var timeout = (arguments.length > 2) ? duration : 7000;
    if (status === "success") {
        message = "<i class=icon-ok-sign></i> " + message;
    } else if (status === "error") {
        message = "<i class=icon-remove-sign></i> " + message;
    }
    SEMICOLON.widget.notifications({
        "data-notify-type": status,
        "data-notify-msg": message,
        "data-notify-timeout": timeout
    });
};

var userLogin = function (successCallback, errorCallback) {
    $.post(apiUrl + "/authorize/login", {
        email: $("#login-email").val(),
        password: $("#login-password").val()
    }, function (result) {
        successCallback(result);
    }, 'json').fail(function (err) {
        errorCallback(err)
    });
};

$('#register-submit-nav').click(function (e) {
    e.preventDefault();
    overlays.hideAll();
    overlays.showScreen('register-screen');
});

$('.login-submit-nav').click(function (e) {
    e.preventDefault();
    console.log(`LoginNav`);
    overlays.hideAll();
    overlays.showScreen('login-screen');
});

$("#login-form").submit(function (event) {
    event.preventDefault();

    var submitButton = $("#login-submit");
    $(submitButton).html("Loading...");
    $(submitButton).prop("disabled", true);

    var errorFunc = function (message) {
        toast(message, "error", 7000);
        $(submitButton).html("Login");
        $(submitButton).prop("disabled", false);
    };

    userLogin(function (result) {
        if (result.status) {
            toast("Login Successful", "success", 2000);
            localStorage.setItem("hashToken", result.data.token);
            setTimeout(function () {
                overlays.hideAll();
                overlays.showScreen('otp-screen');
            }, 600);
        } else {
            var message = (result.message && result.message != "undefined") ? result.message : "Login failed. Check connection";
            errorFunc(message);
        }
    }, function (err) {
        console.log(err);
        errorFunc("Login failed. Check connection");
    });
});

$('#otp-form').submit(function (event) {
    event.preventDefault();

    var self = $(this);
    var submitButton = $("#otp-submit");
    $(submitButton).html("Loading...");
    $(submitButton).prop("disabled", true);

    var errorFunc = function (message) {
        toast(message, "error", 7000);
        $(submitButton).html("Login");
        $(submitButton).prop("disabled", false);
    };

    var otpPass = self.find('[name="otp"]').val();
    var otpHash = localStorage.getItem("hashToken");


    $.post(apiUrl + "/authorize/login/2fa", {
        otp: parseInt(otpPass),
        token: otpHash
    }, function (result) {
        if (result.status) {
            toast("Login successfully", "success", 2000);
            localStorage.setItem("jwt", result.data.token);
            localStorage.removeItem("hashToken");
            console.log(result);
            setTimeout(function () {
                window.location.replace("/dashboard");
            }, 600);
        } else {
            var message = (result.message && result.message != "undefined") ? result.message : "Login failed. Check connection";
            errorFunc(message);
        }
    }, 'json').fail(function (err) {
        console.log(err);
        errorFunc("Login failed. Check connection");
    });
});

$("#register-form").submit(function (event) {
    event.preventDefault();

    var self = $(this);

    var submitButton = $("#register-submit");
    $(submitButton).html("Loading...");
    $(submitButton).prop("disabled", true);

    var errorFunc = function (message) {
        toast(message, "error", 7000);
        $(submitButton).html("Login");
        $(submitButton).prop("disabled", false);
    };

    var pass = self.find('[name="password"]').val();
    var confirm_password = self.find('[name="confirm-password"]').val();
    if (pass !== confirm_password) {
        errorFunc("Password must match");
        return;
    }

    $.post(apiUrl + "/authorize/sign-up", {
        name: self.find('[name="name"]').val(),
        email: self.find('[name="email"]').val(),
        phonenumber: self.find('[name="phonenumber"]').val(),
        password: self.find('[name="password"]').val(),
    }, function (result) {
        if (result.status) {
            toast(result.message, "success", 10000);
            toast("Please activate your account. An activation link has been sent to your email", "success", 10000);
            self.find('[name="name"]').val('');
            self.find('[name="email"]').val('');
            self.find('[name="phonenumber"]').val('');
            self.find('[name="password"]').val('');
            self.find('[name="confirm-password"]').val('');
        } else {
            var message = (result.message && result.message != "undefined") ? result.message : "Login failed. Check connection";
            errorFunc(message);
        }
    }, 'json').fail(function (err) {
        console.log(err);
        errorFunc("Login failed. Check connection");
    });
});

$('[name="createWallet"]').submit(function (event) {
    event.preventDefault();

    var self = $(this);

    var submitButton = self.find('[type="submit"]');
    $(submitButton).html("Loading...");
    $(submitButton).prop("disabled", true);

    var errorFunc = function (message) {
        toast(message, "error", 7000);
        $(submitButton).html("Login");
        $(submitButton).prop("disabled", false);
    };

    $.ajax({
        url: apiUrl + "/api/wallet/createWallet",
        type: 'post',
        data: {
            wallet: self.find('[name="wallet_type"]').val()
        },
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("jwt")
        },
        dataType: 'json',
        success: function (result) {
            if (result.status) {
                toast(result.message, "success", 10000);
                dashBoard();
            } else {
                var message = (result.message && result.message != "undefined") ? result.message : "Login failed. Check connection";
                errorFunc(message);
            }
        },
        error: function () {
            errorFunc("Login failed. Check connection");
        }
    });
});

var updateProfile = function (params) {
    var submitButton = "#profile-submit";
    $(submitButton).html("Updating...");
    $(submitButton).prop("disabled", true);

    $.post(apiUrl + "user/update/info", params, function (result) {
        switch (result.error) {
            case 200:
                $.get(apiUrl + "user/profile", {}, function (resp) {
                    console.log(resp);
                    switch (resp.error) {
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
                }, 'json').fail(function (err) {
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
    }, 'json').fail(function (err) {
        console.log(err);
        toast("Update failed. Check connection", "error", 7000);
        $(submitButton).html("Save Changes");
        $(submitButton).prop("disabled", false);
    });
};

var showHistoryLoading = function (showHistoryLoader) {
    if (showHistoryLoader) {
        $("#history-loading").show();
    } else {
        $("#history-loading").hide();
    }
};

var getOrderDetails = function (order_id, requestUrl) {
    showHistoryLoading(true);
    var modal = '#modal-history';
    if ($(modal).hasClass('in') || (typeof $(modal).data('bs.modal').isShown !== "undefined" && !$(modal).data('bs.modal').isShown)) {
        $(modal).modal('show');
    }
    console.log(requestUrl + "?order_id=" + order_id);
    $.get(requestUrl + "?order_id=" + order_id, function (resp) {
        $("#request-history").html(resp);
        showHistoryLoading(false);
    });
};

var numberFormat = function (number, decimal) {
    decimal = isNaN(decimal = Math.abs(decimal)) ? 2 : decimal;
    var d = ".", t = ",";
    var s = number < 0 ? "-" : "",
        i = String(parseInt(number = Math.abs(Number(number) || 0).toFixed(decimal))),
        j = (j = i.length) > 3 ? j % 3 : 0;
    return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "1" + t) + (decimal ? d + Math.abs(number - i).toFixed(decimal).slice(2) : "");
};

var wordsToUpper = function (str) {
    return str.replace(/\w+/g, function (a) {
        return a.charAt(0).toUpperCase() + a.slice(1).toLowerCase()
    });
};

var timestampToDate = function (unix_timestamp) {
    var date = new Date(unix_timestamp);
    var day = date.getDate();
    var month = date.getMonth();
    var year = date.getFullYear();
    var hours = date.getHours();
    var minutes = "0" + date.getMinutes();

    var n = hours / 12;
    hours = hours % 12;
    return day + "/" + month + "/" + year + " " + (hours == 0 ? "12" : hours) + ":" + minutes.substr(-2) + (n > 0 ? "pm" : "am");
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

$(document).ready(function () {
    var reconnectButton = "#reconnect";
    $(reconnectButton).click(function () {
        $(reconnectButton).html("Connecting...");
        $(reconnectButton).prop("disabled", true);
        $.get(apiUrl + "login/status", {}, function (resp) {
            console.log(resp);
            location.reload(false);
        }, 'json').fail(function (err) {
            console.log(err);
            toast("Network Error. Check connection", "error", 7000);
            $(reconnectButton).html("Try Again");
            $(reconnectButton).prop("disabled", false);
        });
    });
});

getCurrency = function (type) {
    if (type === "bitcoin") {
        return "BTC";
    } else {
        return "LUM";
    }
};

dashBoard = function () {
    $.ajax({
        url: apiUrl + "/api/wallet/getWallets",
        type: 'get',
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("jwt")
        },
        dataType: 'json',
        success: function (result) {
            if (result.status) {
                toast(result.message, "success", 10000);
                var d = $('#wallets-holder');
                d.empty(); //REmove all elements

                console.log(result.data);
                for (let i = 0; i < result.data.length; i++) {
                    const wallet = result.data[i];

                    let address = "";
                    address = "<h4 class='nomargin text-left'>public addresses</h4>";
                    if (wallet["addresses"] !== undefined && wallet.addresses.length > 0) {
                        for (let j = 0; j < wallet.addresses.length; j++) {
                            console.log(wallet.addresses[i]);
                            try {
                                address += `<p class="nomargin" style="overflow-wrap: break-word;">address: ${wallet.addresses[j].address}</p>`;
                                address += `<p class="nomargin" style="overflow-wrap: break-word; margin-bottom: 4px; border-bottom: 1px solid #ccc;">date: ${new Date(Date.parse(wallet.addresses[j].created_on)).toDateString()}</p>`;
                            } catch (e) {
                                console.log(e);
                            }
                        }
                    } else {
                        address += "<p class='nomargin text-center'><i>No public address</i></p>";
                    }

                    let walletHTML = `<div class="col-md-6" style="padding: 5px;">
                                <div class="card">
                                 <h4 class="nomargin text-left uppercase" style="overflow-wrap: break-word;"><a href="/wallet/${wallet.identifier}">${wallet.crypto_type}</a></h4>
                                <h4 class="nomargin text-left" style="overflow-wrap: break-word;">id: ${wallet.identifier}</h4>
                                <h4 class="nomargin text-left" style="overflow-wrap: break-word;">date:  ${new Date(Date.parse(wallet.created_on)).toDateString()}</h4>
                                <hr/>
                                ${address}
                                <hr/>
                                <h4 class="nomargin text-right">confirmed: ${wallet.balance.confirmedBalance} ${getCurrency(wallet.crypto_type)}</h4>
                                <h4 class="nomargin text-right">unconfirmed: ${wallet.balance.confirmedBalance} ${getCurrency(wallet.crypto_type)}</h4>
                                <button class="button button-rounded col_full fright nomargin" name="create-address" value="login">CREATE PUBLIC ADDRESS</button>
                                
</div>
                            </div>`;

                    walletHTML = $(walletHTML);

                    walletHTML.find('[name="create-address"]').click(function (e) {
                        var submitButton = $(this);
                        $(submitButton).html("Loading...");
                        $(submitButton).prop("disabled", true);

                        var errorFunc = function (message) {
                            toast(message, "error", 7000);
                            $(submitButton).html("Login");
                            $(submitButton).prop("disabled", false);
                        };
                        $.ajax({
                            url: apiUrl + "/api/wallet/createAddress",
                            type: 'post',
                            headers: {
                                "Authorization": "Bearer " + localStorage.getItem("jwt")
                            },
                            dataType: 'json',
                            data: {
                                wallet: wallet.crypto_type,
                                identifier: wallet.identifier
                            },
                            success: function (result) {
                                if (result.status) {
                                    toast(result.message, "success", 10000);

                                    setTimeout(function () {
                                        window.location.replace('/dashboard');
                                    }, 600);
                                } else {
                                    var message = (result.message && result.message != "undefined") ? result.message : "Login failed. Check connection";
                                    errorFunc(message);
                                }
                            },
                            error: function () {
                                errorFunc("Check connection");
                            }
                        });
                    });

                    d.append(walletHTML);
                }
            } else {
                var message = (result.message && result.message != "undefined") ? result.message : "Login failed. Check connection";
                toast(message, "error", 10000);
            }
        },
        error: function () {
            toast("Check connection", "error", 7000);
        }
    });
};

$(document).ready(function () {
    try {
        console.log('Jquery still works');
        const jwt = window.localStorage.getItem("jwt");
        console.log(window.location);
        if (jwt) {
            if (window.location.pathname === "/" || window.location.pathname === "/login") {
                window.location = "/dashboard"
            }
            if (window.location.pathname === "/dashboard") {
                dashBoard();
            }
        } else {
            overlays.hideAll();
            overlays.showScreen('login-screen');
        }
    } catch (err) {
        // console.log(err);
    }
});
