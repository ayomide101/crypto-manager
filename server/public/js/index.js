var app = angular.module('request-app', ['ngRoute']);

app.directive('bootstrapSwitch', [
    function () {
        return {
            restrict: 'A',
            require: '?ngModel',
            link: function (scope, element, attrs, ngModel) {
                element.bootstrapSwitch();
                element.on('switchChange.bootstrapSwitch', function (event, state) {
                    if (ngModel) {
                        scope.$apply(function () {
                            ngModel.$setViewValue(state);
                        });
                    }
                });
                scope.$watch(attrs.ngModel, function (newValue, oldValue) {
                    if (newValue) {
                        element.bootstrapSwitch('state', true, true);
                    } else {
                        element.bootstrapSwitch('state', false, true);
                    }
                });
            }
        };
    }
])

    .directive("backButton", [function () {
        return {
            restrict: "E",
            template: '<button class="i-bordered i-circled i-medium divcenter icon-arrow-left2" style="margin-right: 20px !important; line-height:30px !important;"></button>',
            replace: true,
            link: function (scope, element) {
                element.on('click', function () {
                    history.back();
                });
            }
        };
    }]);

app.factory('$dataStorage', ['$window', function ($window) {
    return {
        set: function (key, value) {
            $window.localStorage[key] = value;
        },
        get: function (key, defaultValue) {
            return $window.localStorage[key] || defaultValue;
        },
        remove: function (key) {
            delete $window.localStorage[key];
        },
        setObject: function (key, value) {
            $window.localStorage[key] = JSON.stringify(value);
        },
        getObject: function (key) {
            return JSON.parse($window.localStorage[key] || '{}');
        },
        clearStorage: function () {
            var param = $window.localStorage;
            for (var k in param) {
                if (param.hasOwnProperty(k)) {
                    delete $window.localStorage[k];
                }
            }
        }
    };
}])

    .factory('$httpRequest', ['$http', function ($http) {
        // var requestUrl = "http://localhost:3000/api/";
        var defaultPorts = {"http:": 80, "https:": 443};
        var port = (window.location.port && window.location.port != defaultPorts[window.location.protocol])
            ? ":" + window.location.port : "";
        var requestUrl = window.location.protocol + "//" + window.location.hostname + port + "/";

        return {
            url: requestUrl,
            setUrl: function (new_url) {
                this.url = new_url;
            },
            setUrlPath: function (path) {
                this.url = requestUrl + path;
            },
            get: function (params, successCallback, errorCallback) {
                $http.get(this.url, {params: params}).then(function (data) {
                    successCallback(data);
                }, function (data) {
                    errorCallback(data);
                });
            },
            post: function (params, successCallback, errorCallback) {
                $http.post(this.url, params).then(function (data) {
                    successCallback(data);
                }, function (data) {
                    errorCallback(data);
                });
            }
        };
    }])

    .factory('$loadingBar', ['$httpRequest', '$location', function ($httpRequest, $location) {
        return {
            init: function () {
                var navs = $('nav ul li');
                for (var i = 0; i < navs.length; i++) {
                    if (navs[i].innerHTML.includes($location.path())) {
                        $(navs[i]).addClass("current");
                    } else {
                        $(navs[i]).removeClass("current");
                    }
                }
                $httpRequest.setUrlPath("login/status");
                $httpRequest.get({}, function (resp) {
                    overlays.hideAll();
                    switch (resp.data.error) {
                        case 200:
                            break;
                        default:
                            overlays.showScreen("login-screen");
                            break;
                    }
                }, function (err) {
                    console.log(err);
                    $("#no-connection-screen").show();
                });
            },
            show: function () {
                this.init();
                $('#loading').removeClass('hidden');
            },
            hide: function () {
                this.init();
                $('#splash-screen').hide();
                $(".bt-switch").bootstrapSwitch();
                $('.defer-date').datepicker({
                    autoclose: true,
                    format: 'dd/mm/yyyy',
                    startDate: "today"
                    // startDate: "tomorrow"
                });
                $('.defer-time').datetimepicker({
                    format: 'LT'
                });
                $('.selectpicker').selectpicker('refresh');
                $('#loading').addClass('hidden');
            }
        };
    }])

    .factory('$geoCode', [function () {
        return {
            convertToPosition: function (geocode, successCallback, errorCallback) {
                var geocoder = new google.maps.Geocoder;
                geocoder.geocode({'address': geocode}, function (results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        successCallback(results[0].geometry.location);
                    } else {
                        if (typeof errorCallback !== "undefined")
                            errorCallback(results);
                    }
                });
            },
            convertToAddress: function (lat, lng, successCallback, errorCallback) {
                var geocoder = new google.maps.Geocoder;
                var latlng = {lat: parseFloat(lat), lng: parseFloat(lng)};
                geocoder.geocode({'location': latlng}, function (results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        successCallback(results[0]);
                    } else {
                        if (typeof errorCallback !== "undefined")
                            errorCallback(results);
                    }
                });
            }
        };
    }])

    .factory('$autoComplete', ['$window', function ($window) {
        return {
            initSuggestion: function (elements) {
                var autoComplete = Array();
                for (var i = 0; i < elements.length; i++) {
                    autoComplete[i] = new google.maps.places.Autocomplete(elements[i], $window.autoCompleteOptions);
                }
                return autoComplete;
            }
        };
    }])

    .factory('$orderRequest', ['$geoCode', '$httpRequest', function ($geoCode, $httpRequest) {
        return {
            getEstimate: function (pickup, dropoff, sizefit, type, value, successCallback, errorCallback) {
                var params = {pickup: pickup, dropoff: dropoff, sizefit: sizefit, type: type, value: value};
                $httpRequest.setUrlPath("get-estimate");
                $httpRequest.get(params, successCallback, errorCallback);
            },
            getRequestEstimate: function (pickup, dropoff, sizefit, type, value, successCallback, errorCallback, miscErrorCallBack) {
                var $orderRequest = this;
                var bound = new google.maps.LatLngBounds();
                $geoCode.convertToPosition(pickup, function (latlng) {
                    bound.extend(latlng);
                    var pickup_location = {latitude: latlng.lat(), longitude: latlng.lng()};

                    $geoCode.convertToPosition(dropoff, function (latlng) {
                        bound.extend(latlng);
                        var dropoff_location = {latitude: latlng.lat(), longitude: latlng.lng()};
                        $orderRequest.getEstimate(pickup_location, dropoff_location, sizefit, type, value, successCallback, errorCallback);
                    }, function (err) {
                        if (typeof miscErrorCallBack === "function")
                            miscErrorCallBack(err);
                    });
                }, function (err) {
                    if (typeof miscErrorCallBack === "function")
                        miscErrorCallBack(err);
                });
            }
        };
    }])

    .factory('$authenticateParams', [function () {
        return {
            previousPath: "",
            login: {
                email: "",
                password: "",
                buttonText: "Login",
                buttonDisabled: false
            },
            signUp: {
                fullname: "",
                phonenumber: "",
                email: "",
                password: "",
                buttonText: "Register",
                buttonDisabled: false
            }
        };
    }])

    .factory('$requestParams', ['$sce', function ($sce) {
        return {
            type: "",
            pickup: "",
            pickup_location: "",
            pickupName: "",
            pickupNumber: "",
            requests: [{
                dropoff: "",
                dropoff_location: {},
                recipientName: "",
                recipientNumber: "",
                description: "",
                estimateValue: "",
                size: "",
                defer: {
                    enabled: false,
                    date: "",
                    time: ""
                },
                estimate: 0,
                costEstimate: $sce.trustAsHtml("&#8358;0.00")
            }]
        };
    }]);

app.config(['$provide', '$interpolateProvider', '$routeProvider', '$locationProvider', function ($provide, $interpolateProvider, $routeProvider, $locationProvider) {

    $provide.decorator('$sniffer', ['$delegate', function ($delegate) {
        $delegate.history = false;
        return $delegate;
    }]);

    console.log('App Config');

    $interpolateProvider.startSymbol('{[{');
    $interpolateProvider.endSymbol('}]}');

    $routeProvider.when('', {
        template: "/",
        controller: "AppCtrl"
    }).when('/dispatch-request', {
        templateUrl: "app/dispatch-request",
        controller: "DispatchRequestCtrl"
    }).when('/request-summary', {
        templateUrl: "app/request-summary",
        controller: "RequestSummaryCtrl"
    }).when('/make-payment', {
        templateUrl: "app/payment",
        controller: "PaymentCtrl"
    }).when('/request-history', {
        templateUrl: "app/request-history",
        controller: "HistoryCtrl"
    }).when('/profile', {
        templateUrl: "app/profile",
        controller: "ProfileCtrl"
    }).when('/app-settings', {
        templateUrl: "app/app-settings",
        controller: "SettingsCtrl"
    }).otherwise({
        template: "",
        controller: "AppCtrl"
    });
    //
    // enable HTML5mode to disable hashbang urls
    var HTML5mode = true;
    if (HTML5mode) {
        // $locationProvider.html5Mode(true);
        $locationProvider.html5Mode({
            enabled: true,
            requireBase: true
        }).hashPrefix('');
    }
}]);

app.controller('AppCtrl', ['$scope', '$httpRequest', '$location', '$loadingBar', '$dataStorage', function ($scope, $httpRequest, $location, $loadingBar, $dataStorage) {

    const jwt = $dataStorage.get('jwt', null);
    //
    if (!jwt) {
        overlays.hideAll();
        overlays.showScreen("login-screen");
    } else {
        console.log('Making call');
        $httpRequest.setUrlPath("/authorize/login/status");
        $httpRequest.post({jwt: jwt}, function (resp) {
            switch (resp.data.error) {
                case 200:
                    $loadingBar.show();
                    // $location.path("/dispatch-request");
                    break;
                default:
                    $dataStorage.clearStorage();
                    overlays.hideAll();
                    overlays.showScreen("login-screen");
                    break;
            }
        }, function (err) {
            console.log(err);
            var no_connection = "#no-connection-screen";
            $(no_connection).show();
        });
    }
}]).controller('DispatchRequestCtrl', ['$scope', '$sce', '$orderRequest', '$dataStorage', '$location', '$autoComplete', '$requestParams', '$geoCode', '$loadingBar', function ($scope, $sce, $orderRequest, $dataStorage, $location, $autoComplete, $requestParams, $geoCode, $loadingBar) {
    $scope.disableSubmit = true;
    $scope.dispatch = $requestParams;
    $scope.dispatch.type = "dispatch";
    $scope.dispatch.costEstimate = $sce.trustAsHtml("&#8358;0.00");

    try {
        var business = $dataStorage.getObject("business");
        $scope.dispatch.pickup = business.address;
        $scope.dispatch.pickupName = business.name;
        $scope.dispatch.pickupNumber = business.phonenumber;
        $scope.dispatch.pickup_location = JSON.parse(business.pickup_location);
    } catch (err) {
        $scope.dispatch.pickup_location = {};
    }

    setTimeout(function () {
        $('.selectpicker').selectpicker('refresh');
        var autoSuggestRequestFields = $autoComplete.initSuggestion([document.getElementById('request-dropoff-0')]);
        google.maps.event.addListener(autoSuggestRequestFields[0], 'place_changed', function () {
            getEstimate(0);
        });
        $scope.$watch("dispatch.requests[0].size", function () {
            getEstimate(0);
        });
        $scope.$watch("dispatch.requests[0].estimateValue", function () {
            getEstimate(0);
        });
    }, 50);

    $scope.showRemoveButton = false;
    $scope.addRequest = function () {
        var i = $scope.dispatch.requests.length;
        $scope.dispatch.requests[i] = {
            dropoff: "",
            dropoff_location: {},
            recipientName: "",
            recipientNumber: "",
            description: "",
            estimateValue: "",
            size: "",
            defer: {
                enabled: false,
                date: "",
                time: ""
            },
            estimate: 0,
            costEstimate: $sce.trustAsHtml("&#8358;0.00")
        };
        setTimeout(function () {
            $('.selectpicker').selectpicker('refresh');
            var autoSuggestRequestFields = $autoComplete.initSuggestion([document.getElementById('request-dropoff-' + i)]);
            google.maps.event.addListener(autoSuggestRequestFields[0], 'place_changed', function () {
                getEstimate(i);
            });
            $scope.$watch("dispatch.requests[" + i + "].size", function () {
                getEstimate(i);
            });
            $scope.$watch("dispatch.requests[" + i + "].estimateValue", function () {
                getEstimate(i);
            });
        }, 50);
        $scope.showRemoveButton = ($scope.dispatch.requests.length > 1);
    };

    $scope.removeRequest = function (item) {
        var index = $scope.dispatch.requests.indexOf(item);
        if (index > -1) {
            $scope.dispatch.requests.splice(index, 1);
        }
        angular.forEach($scope.dispatch.requests, function (value, key) {
            setTimeout(function () {
                var autoSuggestRequestFields = $autoComplete.initSuggestion([document.getElementById('request-dropoff-' + key)]);
                google.maps.event.addListener(autoSuggestRequestFields[0], 'place_changed', function () {
                    getEstimate(key);
                });
            }, 50);
        });
        $scope.showRemoveButton = ($scope.dispatch.requests.length > 1);
    };

    var calculateTotalEstimate = function () {
        var totalEstimate = 0;
        for (var i = 0; i < $scope.dispatch.requests.length; i++) {
            if (typeof $scope.dispatch.requests[i].estimate != "undefined" && !isNaN($scope.dispatch.requests[i].estimate)) {
                totalEstimate += $scope.dispatch.requests[i].estimate;
            }
        }
        $scope.dispatch.costEstimate = $sce.trustAsHtml("&#8358;" + numberFormat(totalEstimate));
    };

    var getEstimate = function (index) {
        setTimeout(function () {
            $scope.dispatch.costEstimate = $sce.trustAsHtml('<span style="color: #444444;">...</span>');
            if (typeof $scope.dispatch.pickup !== "undefined" && $scope.dispatch.pickup.trim() != "" && typeof $scope.dispatch.requests[index] !== "undefined" && typeof $scope.dispatch.requests[index].dropoff !== "undefined" && $scope.dispatch.requests[index].dropoff.trim() != "") {
                $scope.dispatch.requests[index].costEstimate = $sce.trustAsHtml('<span style="color: #444444;">...</span>');
                $scope.dispatch.pickup = $("#dispatch-pickup").val();
                $scope.dispatch.requests[index].dropoff = document.getElementById("request-dropoff-" + index).value;
                var size_fit = (typeof $scope.dispatch.requests[index].size !== "undefined" && $scope.dispatch.requests[index].size != "") ? $scope.dispatch.requests[index].size : "bag";
                // $scope.dispatch.size = (typeof $scope.dispatch.size !== "undefined" && $scope.dispatch.size != "") ? $scope.dispatch.size : "bag";
                $orderRequest.getRequestEstimate($scope.dispatch.pickup, $scope.dispatch.requests[index].dropoff, size_fit, "dispatch", $scope.dispatch.estimateValue, function (resp) {
                    var response = resp.data;
                    switch (response.error) {
                        case 200:
                            $scope.dispatch.requests[index].estimate = response.data.totalPayment;
                            $scope.dispatch.requests[index].costEstimate = $sce.trustAsHtml("&#8358;" + numberFormat(response.data.totalPayment));
                            $geoCode.convertToPosition($scope.dispatch.pickup, function (latlng) {
                                $scope.dispatch.pickup_location = {latitude: latlng.lat(), longitude: latlng.lng()};
                            });
                            $geoCode.convertToPosition($scope.dispatch.requests[index].dropoff, function (latlng) {
                                $scope.dispatch.requests[index].dropoff_location = {
                                    latitude: latlng.lat(),
                                    longitude: latlng.lng()
                                };
                            });
                            calculateTotalEstimate();
                            break;
                        default:
                            toast(response.message, "error", 7000);
                            break;
                    }
                }, function (err) {
                    console.log(err);
                });
            } else {
                calculateTotalEstimate();
                // $scope.dispatch.costEstimate = $sce.trustAsHtml("&#8358;0.00");
            }
        }, 50);
    };

    var autoSuggestFields = $autoComplete.initSuggestion([document.getElementById('dispatch-pickup')]);
    google.maps.event.addListener(autoSuggestFields[0], 'place_changed', function () {
        for (var n = 0; n < $scope.dispatch.requests.length; n++) {
            // console.log("ran this get estimate");
            getEstimate(n);
        }
    });

    // quick fix for model update
    $("#dispatch-defer-time").blur(function () {
        $scope.dispatch.defer.time = $("#dispatch-defer-time").val();
    });
    // quick fix against angularJS $watch
    setInterval(function () {
        try {
            $scope.disableSubmit = !$scope.requestForm.$valid;
        } catch (err) {
        }
    }, 600);

    $scope.makeRequest = function () {
        $location.path("/request-summary");
    };

    $scope.$on('$routeChangeSuccess', function (next, current) {
        for (var n = 0; n < $scope.dispatch.requests.length; n++) {
            getEstimate(n);
        }
        $loadingBar.hide();
    });
    $scope.$on('$routeChangeStart', function (next, current) {
        $loadingBar.show();
    });
}])

    .controller('RequestSummaryCtrl', ['$scope', '$sce', '$location', '$requestParams', '$authenticateParams', '$httpRequest', '$loadingBar', function ($scope, $sce, $location, $requestParams, $authenticateParams, $httpRequest, $loadingBar) {
        $authenticateParams.previousPath = "";
        $scope.summary = $requestParams;
        $scope.summaryTitle = wordsToUpper($scope.summary.type);
        $scope.fullDescription = $sce.trustAsHtml($scope.summary.fullDescription);
        $scope.showPickups = ($scope.summary.type == 'dispatch' || $scope.summary.type == 'others');
        $scope.showDropoffs = ($scope.summary.type != 'others');
        $scope.request = {};
        $('#payment-content').hide();

        /*** Paystack Implementation ***/
        var paymentCallback = function (response) {
            // console.log(response);
            setTimeout(function () {
                if (typeof $scope.request.orderId !== "undefined") {
                    window.location = "/user/#?ord=" + $scope.request.orderId;
                } else {
                    window.location = "/user";
                }
            }, 600);
        };

        $scope.hidePaymentModal = function () {
            $('.modal-content').css("maxWidth", "");
            $('#request-summary').show();
            $('#payment-content').hide();
            $loadingBar.hide();
        };

        $scope.paymentParams = {
            container: 'paymentContainer',
            callback: paymentCallback,
            onClose: $scope.hidePaymentModal
        };

        $scope.makePayment = function () {
            $loadingBar.show();
            $httpRequest.setUrlPath("user/profile");
            $httpRequest.get({}, function (data) {
                var resp = data.data;
                $scope.paymentParams.email = resp.data.email;
                $('.modal-content').css("maxWidth", "430px");
                $('#request-summary').hide();
                $('#payment-content').show();
                $loadingBar.hide();
                PaystackPop.setup($scope.paymentParams);
            }, function (err) {
                $loadingBar.hide();
                console.log(err);
            });
        };
        /*** End Paystack Implementation ***/

        $scope.$on('$routeChangeSuccess', function (next, current) {
            $httpRequest.setUrlPath("login/status");
            $httpRequest.get({}, function (res) {
                var response = res.data;
                switch (response.error) {
                    case 200:
                        var fullDetails = $requestParams.description;
                        if ($requestParams.type == "shopping" || $requestParams.type == "food") {
                            fullDetails += fullDetails + "<br/>&nbsp;- items -";
                            for (var n = 0; n < $requestParams.items.length; n++) {
                                fullDetails += "<br/>" + $requestParams.items[n].description + " => &#8358;" + numberFormat($requestParams.items[n].amount);
                            }
                        }
                        $scope.fullDescription = $sce.trustAsHtml(fullDetails);
                        $requestParams.fullDescription = fullDetails;
                        $httpRequest.setUrlPath("make-request/" + $scope.summary.type.toLowerCase());
                        $httpRequest.post($requestParams, function (data) {
                            var resp = data.data;
                            switch (resp.error) {
                                case 200:
                                    $scope.showExpressOptions = false;

                                    $scope.request.orderId = resp.data.order.unique_id;
                                    $scope.request.estimateValue = resp.data.order.value_of_item;
                                    $scope.request.cost = resp.data.payment.real_cost;
                                    $scope.request.totalCost = resp.data.payment.total_payment;

                                    // pass data to paystack init object
                                    $scope.paymentParams.key = resp.data.payment.key;
                                    $scope.paymentParams.reference = resp.data.payment.transaction_id;
                                    $scope.paymentParams.ref = resp.data.payment.transaction_id;
                                    $scope.paymentParams.amount = resp.data.payment.total_payment * 100;

                                    $loadingBar.hide();
                                    break;
                                default:
                                    var message = (typeof resp.message !== "undefined") ? resp.message : "Request failed, try again";
                                    toast(message, "error", 7000);
                                    $location.path("/" + $scope.summary.type.toLowerCase() + "-request").replace();
                                    break;
                            }
                        }, function (err) {
                            console.log(err);
                            $location.path("/" + $scope.summary.type.toLowerCase() + "-request").replace();
                        });
                        break;
                    default:
                        $authenticateParams.previousPath = "/request-summary";
                        $location.path("/login").replace();
                        break;
                }
            }, function (err) {
                console.log(err);
                $location.path("/login").replace();
            });
        });
        $scope.$on('$routeChangeStart', function (next, current) {
            $('.modal-content').css("maxWidth", "");
            $('#request-summary').show();
            $loadingBar.show();
        });
    }])

    .controller('LoginCtrl', ['$scope', '$location', '$httpRequest', '$authenticateParams', '$loadingBar', function ($scope, $location, $httpRequest, $authenticateParams, $loadingBar) {
        $scope.login = $authenticateParams.login;
        $scope.signUp = $authenticateParams.signUp;
        $scope.fbButtonText = "Login with Facebook";
        $scope.fbRButtonText = "Register with Facebook";
        $scope.fButtonDisabled = false;

        $scope.setSignUpActive = function () {
            $('#tabs').tabs({active: 1});
        };
        $scope.setLoginActive = function () {
            $('#tabs').tabs({active: 0});
        };

        $scope.userLogin = function () {
            $scope.login.buttonDisabled = true;
            $scope.login.buttonText = "Loading...";
            $httpRequest.setUrlPath("login");
            $httpRequest.post({email: $scope.login.email, password: $scope.login.password}, function (res) {
                var response = res.data;
                switch (response.error) {
                    case 200:
                        doRefresh = true;
                        $scope.login.buttonDisabled = false;
                        $scope.login.buttonText = "Login";
                        if ($authenticateParams.previousPath.trim() != "") {
                            $location.path($authenticateParams.previousPath).replace();
                        } else {
                            $location.path("#/").replace();
                        }
                        break;
                    default:
                        var message = (response.message && response.message != "undefined") ? response.message : "Login failed. Check connection";
                        toast(message, "error", 7000);
                        $scope.login.buttonDisabled = false;
                        $scope.login.buttonText = "Login";
                        break;
                }
            }, function (err) {
                console.log(err);
                toast("Login failed. Check connection", "error", 7000);
                $scope.login.buttonDisabled = false;
                $scope.login.buttonText = "Login";
            });
        };

        $scope.$on('$routeChangeSuccess', function (next, current) {
            // $('.modal-dialog').css("maxWidth", "430px");
            $('.modal-content').css("maxWidth", "430px");
            $("#tabs").tabs({active: 0});

            $httpRequest.setUrlPath("login/status");
            $httpRequest.get({}, function (res) {
                var response = res.data;
                switch (response.error) {
                    case 200:
                        if ($authenticateParams.previousPath.trim() != "") {
                            $location.path($authenticateParams.previousPath).replace();
                        } else {
                            $location.path("#/").replace();
                        }
                        break;
                }
            }, function (err) {
                console.log(err);
            });

            $loadingBar.hide();
        });
        $scope.$on('$routeChangeStart', function (next, current) {
            $loadingBar.show();
            $('.modal-content').css("maxWidth", "");
        });
    }])

    .controller('PaymentCtrl', ['$scope', '$loadingBar', function ($scope, $loadingBar) {
        $scope.$on('$routeChangeSuccess', function (next, current) {
            $loadingBar.hide();
        });
        $scope.$on('$routeChangeStart', function (next, current) {
            $loadingBar.show();
        });
    }])

    .controller('HistoryCtrl', ['$scope', '$dataStorage', '$httpRequest', '$location', '$loadingBar', function ($scope, $dataStorage, $httpRequest, $location, $loadingBar) {
        $scope.profile = $dataStorage.getObject("profile");
        $scope.requests = [];
        if (typeof $scope.profile.extraData !== "undefined") {
            $scope.profile.extraData = {};
        }

        $scope.makeRequest = function () {
            $location.path("/dispatch-request");
        };

        $scope.getOrderRequestDetails = function (order_id) {
            var requestUrl = apiUrl.replace("/api", "/app");
            getOrderDetails(order_id, requestUrl + "request-details");
        };

        $scope.$on('$routeChangeSuccess', function (next, current) {
            $('#history-tabs').tabs({active: 0});
            $httpRequest.setUrlPath("user/history");
            $httpRequest.get({}, function (resp) {
                switch (resp.data.error) {
                    case 200:
                        $scope.requests = resp.data.data;
                        for (var i = 0; i < $scope.requests.length; i++) {
                            $scope.requests[i].date = timestampToDate($scope.requests[i].created_on);
                        }
                        break;
                    default:
                        toast(resp.data.message, "error", 7000);
                        break;
                }
            }, function (err) {
                console.log(err);
            });
            $loadingBar.hide();
        });
        $scope.$on('$routeChangeStart', function (next, current) {
            $loadingBar.show();
        });
    }])

    .controller('ProfileCtrl', ['$scope', '$dataStorage', '$loadingBar', function ($scope, $dataStorage, $loadingBar) {
        $scope.profile = $dataStorage.getObject("profile");
        $scope.updateProfileData = function () {
            // {fullname: fullName, phonenumber: phoneNumber}
            updateProfile($scope.profile);
        };

        $scope.$on('$routeChangeSuccess', function (next, current) {
            $loadingBar.hide();
        });
        $scope.$on('$routeChangeStart', function (next, current) {
            $loadingBar.show();
        });
    }])

    .controller('SettingsCtrl', ['$scope', '$dataStorage', '$autoComplete', '$geoCode', '$loadingBar', function ($scope, $dataStorage, $autoComplete, $geoCode, $loadingBar) {
        $scope.disableButton = false;
        $scope.business = $dataStorage.getObject("business");
        $scope.saveBusinessData = function () {
            // setTimeout(function () {
            $scope.business.address = document.getElementById("business-address").value;
            $dataStorage.setObject("business", $scope.business);
            toast("Settings Updated", "success", 7000);
            // }, 300);
        };

        var autoSuggestFields = $autoComplete.initSuggestion([document.getElementById('business-address')]);
        google.maps.event.addListener(autoSuggestFields[0], 'place_changed', function () {
            // $scope.disableButton = true;
            $geoCode.convertToPosition($scope.business.address, function (latlng) {
                $scope.business.location = JSON.stringify({latitude: latlng.lat(), longitude: latlng.lng()});
                // $scope.disableButton = false;
            });
        });

        $scope.$on('$routeChangeSuccess', function (next, current) {
            $loadingBar.hide();
        });
        $scope.$on('$routeChangeStart', function (next, current) {
            $loadingBar.show();
        });
    }]);
