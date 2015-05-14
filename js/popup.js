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
        callback = callback || function() {};
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
var userObj = {};
var loadtag = true;
OATool.sendMessage({
    type: "getinfo"
}, function(data) {
    console.log(data);
    if (data.status == 3) {
        OATool.showTip("账户正在验证，请稍后");
    } else if (data.status == 5) {
        OATool.showTip("服务器连接中");
    } else if (data.status == 4) {
        OATool.showTip("自动登录中,请稍后");
    } else if (data.status == 1) {
        if (typeof(data.username) != 'undefined') {
            $(".usernamebox input").val(data.username);
            $(".passwordbox input").val(data.password);
            $(".username").text(data.username);
            userObj = data;
        } else {
            OATool.loginboxshow();
        }
    }
});
OATool.onMessage(function(message, sender, sendResponse) {
    if (message.type == "verify") {
        if (message.data.userstatus == 1) {
            OATool.showTip("账号验证通过");
            OATool.closeTip(2000);
            userObj = {
                name: message.data.username,
                password: message.data.password
            }
            $(".username").text(message.data.username)
        } else if (message.data.userstatus == 2) {
            OATool.showTip("密码错误，谨慎输入");
        } else {
            OATool.showTip("用户名错误");
        }
    } else if (message.type == "init") {
        //后台初始化完成
        console.log(message.data);
        if (message.data.username) {
            $(".usernamebox input").val(message.data.username);
            $(".passwordbox input").val(message.data.password);
            $(".username").text(message.data.username);
            userObj = message.data;
        } else {
            OATool.loginboxshow();
        }
        userObj = message.data;
        init();
    } else if (message.type == "autologin") {
        OATool.showTip("登录成功");
        window.open('http://172.18.1.48/seeyon/main.do?method=index');
        OATool.closeTip(2000);
    } else if (message.type == "latestmsg") {
        var str = "";
        message.data.forEach(function(value, index) {
            str += '<li data-id="' + value.articleId + '"><h2 title="' + value.title + '">' + value.title + '</h2><aside><div>' + value.type + '</div><div>' + value.pubtime + '</div><div>' + value.sender + '</div></aside></li>'
        });
        $(".noticebox ul").prepend(str);
    } else if (message.type == "oldmsg") {
        loadtag = true;
        var str = "";
        message.data.forEach(function(key, value) {
            str += '<li data-id="' + value.articleId + '"><h2 title="' + value.title + '">' + value.title + '</h2><aside><div>' + value.type + '</div><div>' + value.pubtime + '</div><div>' + value.sender + '</div></aside></li>'
        });
        $(".noticebox ul").append(str);
    }
});
OATool.sendMessage({
    type: "latestmsg"
}, function() {});
chrome.browserAction.setBadgeText({text:''});
function init() {}
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
    console.log(typeof(userObj.username) == 'undefined');
    if (typeof(userObj.username) == 'undefined') {
        OATool.loginboxshow();
    } else {
        OATool.showTip("自动登录中，请稍后");
        OATool.sendMessage({
            type: "autologin"
        }, function(data) {});
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
                $(".username").text("未登录");
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
        console.log(userObj);
        if (typeof(userObj.username) != 'undefined') {
            console.log(password);
            if (username != userObj.username) {
                OATool.showTip("账户正在验证，请稍后");
                OATool.sendMessage({
                    type: "verify",
                    data: {
                        username: username,
                        password: password
                    }
                }, function(data) {});
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
            }, function(data) {});
        }
    }
});
$(".usernamebox input,.passwordbox input").keyup(function() {
    if ($.trim($(this).val()).length > 0) {
        $(this).css("border-color", "#D1D1D1");
    }
});
$(".contentbox").on("scroll", function() {
    var boxheight = $(this).height();
    var conHeight = $(".noticeCon").height();
    var scrolltop = $(this).scrollTop();
    if (scrolltop >= 0.8 * (conHeight - boxheight) && loadtag) {
        var articleId = $(".noticebox ul li:last").attr("data-id");
        loadtag = false;
        OATool.sendMessage({
            type: "oldmsg",
            data: {
                articleId: articleId,
                limit: 10
            }
        });
    }
});
socket.on('connect', function() {
    /*socket.on('message', function(message) {
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
    }, 1000);*/
    var loadtag = true;
    //旧消息
    /*socket.on('oldmsgRes', function(data) {
        loadtag = true;
        var str = "";
        data.forEach(function(key, value) {
            str += '<li data-id="' + value.articleId + '"><h2 title="' + value.title + '">' + value.title + '</h2><aside><div>' + value.type + '</div><div>' + value.pubtime + '</div><div>' + value.sender + '</div></aside></li>'
        });
        $(".noticebox ul").append(str);
    });*/
    //最新消息
    /*socket.on('latestmsgRes', function(data) {
        var str = "";
        data.forEach(function(value, index) {
            if (index == 1) {
                OATool.storageset('user', {
                    lastmsgId: value.articleId
                });
            }
            str += '<li data-id="' + value.articleId + '"><h2 title="' + value.title + '">' + value.title + '</h2><aside><div>' + value.type + '</div><div>' + value.pubtime + '</div><div>' + value.sender + '</div></aside></li>'
        });
        $(".noticebox ul").prepend(str);
    });*/
    /*socket.emit('latestmsgReq', {
        limit: 10,
        lastmsgId: OATool.storageget('user').lastmsgId
    });*/
    /*$(".contentbox").on("scroll", function() {
        var boxheight = $(this).height();
        var conHeight = $(".noticeCon").height();
        var scrolltop = $(this).scrollTop();
        if (scrolltop >= 0.8 * (conHeight - boxheight) && loadtag) {
            var articleId = $(".noticebox ul li:last").attr("data-id");
            loadtag = false;
            socket.emit('oldmsgReq', {
                articleId: articleId,
                limit: 10
            });
        }
    });*/
});
