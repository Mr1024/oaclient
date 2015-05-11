var OATool = {
    showTip: function(txt) {
        $(".msgremindbox").text(txt).slideDown();
    },
    closeTip: function(time) {
        var time = time || 0;
        setTimeout(function() {
            $(".msgremindbox").slideUp();
        }, time);
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
    sendMessage: function(data, callback) {
        chrome.runtime.sendMessage(data,
            function(data) {
                callback(data);
            });
    },
    onMessage: function(callback) {
        chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
            callback(message, sender, sendResponse);
        })
    }
}
var userObj;
OATool.sendMessage({
    type: "getinfo"
}, function(data) {
    if (data.name) {
        $(".usernamebox input").val(data.name);
        $(".passwordbox input").val(data.password);
        $(".username").text(data.name);
        userObj = data;
    } else {
        OATool.loginboxshow();
    }
    init();
});
OATool.onMessage(function(message, sender, sendResponse) {
    console.log(message);
    if (message.type = "verify") {
        if (message.data == 1) {
            OATool.showTip("账号验证通过");
            OATool.closeTip(5000);
        } else if (message.data == 2) {
            OATool.showTip("密码错误，谨慎输入");
        } else {
            OATool.showTip("用户名错误");
        }
    }
});

function init() {
    var i = 1;
    var socket = io.connect('http://localhost:8080');
    $(".settingbtn").on("click", function() {
        $(".loginbox").css({
            top: "0px",
            opacity: 1
        });
    });
    //自动登录
    $(".powerbtn").on("click", function() {
        if (!userObj) {
            OATool.loginboxshow();
        } else {
            OATool.showTip("自动登录中，请稍后");
            OATool.sendMessage({
                type: "verify",
                data: userObj
            }, function(data) {
                if (data == 1) {
                    OATool.showTip("登录成功");
                    window.open('http://172.18.1.48/seeyon/main.do?method=index', 'suboa');
                    OATool.closeTip(5000);
                } else if (data == 2) {
                    OATool.showTip("密码错误，谨慎输入");
                } else {
                    OATool.showTip("用户名错误");
                }

            });
        }
    });
    //退出账户
    $(".signoutbtn").on("click", function() {
        $.get('http://172.18.1.48/seeyon/login/logout', function(data) {
            console.log(data);
            OATool.sendMessage({
                type: "logout"
            }, function(data) {
                if (data == "ok") {
                    $(".usernamebox input").val("");
                    $(".passwordbox input").val("");
                    OATool.loginboxshow();
                }
            })
        });
    });
    $(".loginbox .canclebtn").on("click", function() {
        if (!userObj) {
            return
        }
        $(".loginbox").css({
            top: "600px",
            opacity: 0
        });
    });
    $(".passwordbox input").keydown(function(e) {
        if (e.keyCode == 13) {
            $(".loginbox .sigininbtn").trigger("click");
        }
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
                console.log(password);
                if (username != userObj.name) {
                    OATool.showTip("账户正在验证，请稍后");
                    OATool.sendMessage({
                        type: "verify",
                        data: {
                            username: username,
                            password: password
                        }
                    }, function(data) {
                        if (data == 1) {
                            OATool.showTip("账号验证通过");
                            OATool.closeTip(5000);
                        } else if (data == 2) {
                            OATool.showTip("密码错误，谨慎输入");
                        } else {
                            OATool.showTip("用户名错误");
                        }

                    });
                } else {
                    if (password == userObj.password) {
                        OATool.loginboxclose();
                    } else {
                        $(".passwordbox input").css("border-color", "red").focus();
                    }
                }
            } else {
                OATool.showTip("账户正在验证，请稍后");
                OATool.sendMessage({
                    type: "verify",
                    data: {
                        username: username,
                        password: password
                    }
                }, function(data) {
                    console.log(data);
                    if (data == 1) {
                        OATool.showTip("账号验证通过");
                        userObj = {
                            name: username,
                            password: password
                        };
                        OATool.closeTip(5000);
                    } else if (data == 2) {
                        OATool.showTip("密码错误，谨慎输入");
                    } else {
                        OATool.showTip("用户名错误");
                    }
                });
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

}
