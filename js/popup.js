var OATool = {
    showTip: function(txt) {
        $(".msgremindbox").text(txt).slideDown();
    },
    closeTip: function() {
        $(".msgremindbox").slideUp();
    },
    loginboxshow: function() {
        $(".loginbox").css({
            top: "0px",
            opacity: 1
        });
    },
    loginboxclose: function() {
        $(".loginbox").css({
            top: "600px",
            opacity: 0
        });
    },
    sendMsg: function(data, callback) {
        chrome.runtime.sendMessage(data,
            function(data) {
                callback(data);
            });
    },
    storageset: function(obj, callback) {
        chrome.storage.sync.set(obj,
            function() {
                callback();
            });
    },
    storageget: function(str, callback) {
        chrome.storage.sync.get(str, function(result) {
            callback(result[str]);
        });
    }
}


var i = 1;
var socket = io.connect('http://localhost:8080');
OATool.storageset({
    "user": {
        "name": "zhangyizhong",
        "status": 2,
        "lastMsgId": "123"
    }
}, function() {
    console.log("t1");
});
OATool.storageget("user", function(data) {
    var userObj = data;
    if (userObj) {
        if (userObj.status == 1) {
            $(".username").text(userObj.name);
            $(".usernamebox input").val(userObj.name);
             OATool.sendMsg({
                "type": "getinfo",
                "data": {
                    "name": userObj.name
                }
            },function(data){
            	console.log(data);
            });
        } else if (userObj.status == 2) {
            $(".username").text(userObj.name);
            $(".usernamebox input").val(userObj.name);
            OATool.sendMsg({
                "type": "verify",
                "data": {
                    "name": userObj.name
                }
            },function(data){
            	console.log(data);
            });
            OATool.showTip("账户正在验证，请稍后");
        } else {
            OATool.loginboxshow();
        }
    } else {
        OATool.loginboxshow();
    }
});
/*var user = localStorage.user;
var userObj
if (user) {
    userObj = JSON.parse(user);
    $(".username").text(userObj.name);
    $(".usernamebox input").val(userObj.name);
    $(".passwordbox input").val(userObj.password)
} else {
    $(".loginbox").css({
        top: "0px",
        opacity: 1
    });
}*/
$(".settingbtn").on("click", function() {
    $(".loginbox").css({
        top: "0px",
        opacity: 1
    });
});
$(".loginbox .canclebtn").on("click", function() {
    $(".loginbox").css({
        top: "600px",
        opacity: 0
    });
});
$(".loginbox .sigininbtn").on("click", function() {
    var username = $.trim($(".usernamebox input").val());
    var password = $.trim($(".passwordbox input").val());
    if (username.length == 0) {
        $(".usernamebox input").css("border-color", "red").focus();
    } else if (password.length == 0) {
        $(".passwordbox input").css("border-color", "red").focus();
    } else {
        $(".loginbox").css({
            top: "600px",
            opacity: 0
        });
        $(".username").text(username);
        if (userObj) {
            if (username != userObj.name || password != userObj.password) {
                OATool.showTip("账户正在验证，请稍后");
                OATool.sendMessage({
                    type: "verifypw",
                    data: {
                        username: username,
                        password: password
                    }
                }, function(data) {

                });
            } else {
                OATool.showTip("账户正在验证，请稍后");
            }
        }
    }
});
$(".usernamebox input,.passwordbox input").keyup(function() {
    if ($.trim($(this).val()).length > 0) {
        $(this).css("border-color", "#D1D1D1");
    }
});
socket.on('connect', function() {
    socket.on('message', function(message) {
        $("ul").append("<li>" + message + "</li>");
    });
    socket.on('disconnect', function() {
        console.log("close");
    });
    socket.on("test", function(data) {
        $("ul").append("<li>test" + data + "</li>");
    })
    setInterval(function() {
        socket.send(i++);
    }, 1000);

});
