/**
 * Created by Ayomide on 04/03/2017.
 */

var showHistoryLoading = function(showHistoryLoader){
    if(showHistoryLoader){
        $("#history-loading").show();
    } else {
        $("#history-loading").hide();
    }
};

var getOrderDetails = function(order_id){
    showHistoryLoading(true);
    var modal = '#modal-history';
    if($(modal).hasClass('in') || (typeof $(modal).data('bs.modal').isShown !== "undefined" && !$(modal).data('bs.modal').isShown)){
        $(modal).modal('show');
    }
    var defaultPorts = {"http:":80,"https:":443};
    var port = (window.location.port && window.location.port != defaultPorts[window.location.protocol])
        ? ":"+window.location.port : "";
    var requestUrl = window.location.protocol+"//"+window.location.hostname+port+"/app/request-details";
    $.get(requestUrl+"?order_id="+order_id, function(resp){
        $("#request-history").html(resp);
        showHistoryLoading(false);
    });
};

$("#profile-form").submit(function(event){
    event.preventDefault();

    var submitButton = $("#profile-submit");
    $(submitButton).html("Loading...");
    $(submitButton).prop("disabled", true);

    var requestUrl = $("#profile-form").attr("action");
    var suffix = requestUrl.split("/");
    suffix = suffix[suffix.length - 2];
    requestUrl = requestUrl.replace(suffix, "api/"+suffix)+"/info";

    $.post(requestUrl, {fullname: $("#profile-fullname").val(), phonenumber: $("#profile-phonenumber").val()}, function(result){
        switch(result.error){
            case 200:
                // window.location.reload(false);
                toast("Profile Updated", "success", 7000);
                $(submitButton).html("Save Changes");
                $(submitButton).prop("disabled", false);
                $("#account-name").html(result.data.name);
                $("#account-phonenumber").html(result.data.phonenumber);
                setTimeout(function(){
                    $.magnificPopup.close();
                }, 600);
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
});

$("#password-form").submit(function(event){
    event.preventDefault();

    var submitButton = $("#password-submit");
    $(submitButton).html("Loading...");
    $(submitButton).prop("disabled", true);

    var requestUrl = $("#password-form").attr("action");
    var suffix = requestUrl.split("/");
    suffix = suffix[suffix.length - 2];
    requestUrl = requestUrl.replace(suffix, "api/"+suffix)+"/password";

    $.post(requestUrl, {password: $("#password").val(), new_password: $("#new-password").val(), confirm_password: $("#confirm-password").val()}, function(result){
        switch(result.error){
            case 200:
                // window.location.reload(false);
                toast("Password Change Successful", "success", 7000);
                $(submitButton).html("Save Changes");
                $(submitButton).prop("disabled", false);
                setTimeout(function(){
                    $.magnificPopup.close();
                }, 600);
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
});

$(".order-details").click(function(event){
    event.preventDefault();
    var order_id = $(this).attr("data-request");
    getOrderDetails(order_id);
});

$(document).ready(function(){
    var url = location.href.split("?");
    if(url[1] !== "undefined"){
        var params = url[1].split("&");
        for(var i=0; i<params.length; i++){
            if(params[i].includes("ord")){
                var order_id = params[i].split("=")[1];
                console.log(order_id);
                getOrderDetails(order_id);
                break;
            }
        }
    }
});
