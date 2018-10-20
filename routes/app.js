import Functions from "../modules/functions";

var express = require('express');
var router = express.Router();
var base_url = Functions.getConfig('base_url');

/* GET dispatch-request layout. */
router.get('/dispatch-request', function(req, res) {
	res.render("app/dispatch-request");
});

/* GET request-summary layout. */
router.get('/request-summary', function(req, res) {
    res.render("app/request-summary");
});

/* GET request-summary layout. */
router.get('/request-history', function(req, res) {
    res.render("app/request-history");
});

/* GET make-payment layout. */
router.get('/make-payment', function(req, res) {
    res.send('respond with make-payment layout');
});

router.get('/request-details', function(req, res) {
    var template_properties = {base_url: base_url};
    template_properties.title = 'User Dashboard';

    var sessionId = functions.getConfig('session.security').name;
    var user = require('../modules/user-account');
    user.checkLoggedIn(req.cookies[sessionId], function(loggedIn){
        if(loggedIn){
            user.getAuthDetails(req.cookies[sessionId], function (err, resp) {
                var auth_info = JSON.parse(resp[0].auth_info);
                var order_id = (req.query.order_id === 'undefined') ? '' : req.query.order_id;
                require('../modules/order-request').getOrderDetails(order_id, auth_info.jwt_token, function (historyResponse) {
                    console.log(historyResponse);
                    switch(historyResponse.error){
                        case 200:
                            historyResponse.data.date = functions.timestampToDate(historyResponse.data.created_on);
                            historyResponse.data.totalAmount = functions.numberFormat(historyResponse.data.totalAmount);
                            historyResponse.data.value_of_item = functions.numberFormat(historyResponse.data.value_of_item);
                            historyResponse.data.totalDistance = parseFloat(historyResponse.data.totalDistance/1000).toFixed(2)+"km";
                            historyResponse.data.size = "";
                            switch (historyResponse.data.size_fit.toLowerCase()){
                                case "bag":
                                    historyResponse.data.size = "In a Bag";
                                    break;
                                case "bike":
                                    historyResponse.data.size = "On a Bike";
                                    break;
                                case "car":
                                    historyResponse.data.size = "In a Car";
                                    break;
                            }
                            template_properties.request = historyResponse.data;
                            break;
                        default:
                            template_properties.noHistoryMessage = true;
                            break;
                    }
                    res.render('app/request-details', template_properties);
                }, function(historyError){
                    console.log(historyError);
                    template_properties.noHistory = true;
                    res.render('app/request-details', template_properties);
                });
            });
        } else {
            template_properties.notLoggedIn = true;
            res.render('app/request-details', template_properties);
        }
    });
});

router.get('/profile', function(req, res) {
    res.render("app/profile");
});

router.get('/app-settings', function(req, res) {
    res.render("app/app-settings");
});

module.exports = router;
