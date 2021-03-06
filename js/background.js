var socket = io.connect('http://172.18.24.64:8080');
var BGTool = {
    storageget: function(str) {
        var obj = localStorage[str];
        if (obj) {
            return JSON.parse(obj);
        } else {
            return {};
        }
    },
    storageset: function(key, value) {
        if (typeof value == "string") {
            valueobj = JSON.parse(value);
        } else {
            valueobj = value;
        }
        var oldobj = localStorage[key];

        if (oldobj) {
            oldobj = JSON.parse(oldobj);
            valueobj = $.extend({}, oldobj, valueobj);
        }
        localStorage[key] = JSON.stringify(valueobj);
    },
    sendMessage: function(data, callback) {
        callback = callback || function() {};
        chrome.runtime.sendMessage(data,
            function(data) {
                callback(data);
            });
    },
    saveUser: function(obj) {
        //socket.on("connect", function() {
        console.log(obj);
        socket.emit("saveUserReq", obj);
        //});

    }
};

//currUserObj status:1 成功 2 验证失败 3 正在验证 4 后台自动登录 5 数据库连接中
var currUserObj = {
    status: 5
};
socket.on('connect', function() {
    var userObj = BGTool.storageget('user');
    if (userObj.username) {
        socket.emit("getInfoReq", userObj);
        socket.on('getInfoRes', function(data) {
            if (data.password != undefined) {
                currUserObj = data;
                currUserObj.status = 1;
            } else {
                currUserObj = {
                    status: 1
                };
            }
            BGTool.sendMessage({
                type: "init",
                data: currUserObj
            }, function() {});
            init();
        });
    } else {
        currUserObj = {
            status: 1
        };
        BGTool.sendMessage({
            type: "init",
            data: currUserObj
        }, function(data) {});
        init();
    }
    socket.on("saveUserRes", function(data) {
        BGTool.storageset('user', data);
    });
    socket.on('latestmsgRes', function(data) {
        if (data.length > 0) {
            BGTool.storageset('user', {
                lastmsgId: data[0].articleId
            });
        }
        BGTool.sendMessage({
            type: 'latestmsg',
            data: data
        }, function() {});
    });
    socket.on('oldmsgRes', function(data) {
        /*if (data.length > 0) {
            BGTool.storageset('user', {
                lastmsgId: data[0].articleId
            });
        }*/
        BGTool.sendMessage({
            type: 'oldmsg',
            data: data
        }, function() {});
    });
    socket.on('unreadmsgRes', function(data) {
        if (data.data) {
            if (data.type == "tip") {
                var txtsize = data.data.length;
                if (txtsize > 0)
                    chrome.browserAction.setBadgeText({
                        text: '' + txtsize
                    });
            } else {
                showNotification(data.data);
            }
        }

    });
    setInterval(function() {
        var userinfo = BGTool.storageget('user');
        if (typeof userinfo.lastmsgId != "undefined") {
            checkIslogin(function() {
                getUsername(function(isGet, uname) {
                    if (isGet) {
                        socket.emit("unreadmsgReq", {
                            username: uname,
                            lastmsgId: userinfo.lastmsgId
                        });
                    } else {
                        socket.emit("unreadmsgReq", {
                            lastmsgId: userinfo.lastmsgId
                        });
                    }
                });
            });
        }
    }, 1000 * 60 * 2);
});

/*初始化*/
function init() {

}
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.type == 'verify') {
        currUserObj = $.extend({
            status: 3
        }, message.data);
        login(currUserObj);
    } else if (message.type == 'autologin') {
        currUserObj.status = 4;
        checkIslogin(function(status) {
            if (status) {
                chrome.tabs.create({
                    url: 'http://172.18.1.48/seeyon/main.do?method=index',
                    active: true,
                    pinned: false
                }, function(tab) {});
                getUsername();
            } else {
                login(currUserObj);
            }
        });
    } else if (message.type == 'getinfo') {
        sendResponse(currUserObj);
    } else if (message.type == 'logout') {
        currUserObj = {};
        localStorage.removeItem('user');
        sendResponse("ok");
    } else if (message.type == 'latestmsg') {
        socket.emit('latestmsgReq', {
            limit: 10,
            lastmsgId: BGTool.storageget('user').lastmsgId
        });
    } else if (message.type == 'oldmsg') {
        socket.emit('oldmsgReq', message.data);
    } else {
        sendResponse("ok");
        showNotification({
            type: "公告",
            text: "关于胡鑫同志任前公示的公告",
            asidetxt: "2015-05-08 16:18 彭谆 ",
            priority: 2
        }, function(notificationId) {
            login();
        });
    }
});
/* $.get('http://www.baidu.com', function(data) {

 });*/
var loginStatus = null;
chrome.webRequest.onBeforeSendHeaders.addListener(function(details) {
    //console.log(details);
    /*for (var i = 0, headerLen = details.requestHeaders.length; i < headerLen; ++i) {
        if (details.requestHeaders[i].name == 'User-Agent') {
            details.requestHeaders.splice(i, 1);
            break;
        }
    }*/
    loginStatus = null;
    details.requestHeaders.push({
        name: "Origin",
        "value": "http://172.18.1.48"
    }, {
        name: "Referer",
        value: "http://172.18.1.48/seeyon/index.jsp"
    });
    return {
        requestHeaders: details.requestHeaders
    };
}, {
    urls: [
        "http://172.18.1.48/seeyon/login/proxy"
    ]
}, [
    "blocking",
    "requestHeaders"
]);
chrome.webRequest.onHeadersReceived.addListener(function(details) {
    if (details.url == 'http://172.18.1.48/seeyon/login/proxy') {
        for (var i = 0, headerLen = details.responseHeaders.length; i < headerLen; ++i) {
            if (details.responseHeaders[i].name == 'LoginError') {
                var LoginErrorV = details.responseHeaders[i].value;
                loginStatus = {
                    "LoginError": LoginErrorV
                };
                switch (LoginErrorV) {
                    case '7':
                        setTimeout(function() {
                            login()
                        }, Math.random() * 10000);
                        break;
                    case '2':
                        BGTool.sendMessage({
                            type: "verify",
                            data: {
                                userstatus: 2
                            }
                        }, function() {});
                        break;
                    case '1':
                        BGTool.sendMessage({
                            type: "verify",
                            data: {
                                userstatus: 3
                            }
                        }, function() {});
                        break;
                }
            } else if (details.responseHeaders[i].name == 'LoginOK') {
                if (currUserObj.status == 4) {
                    BGTool.sendMessage({
                        type: "autologin",
                        data: $.extend({
                            userstatus: 1
                        }, currUserObj)
                    }, function() {});
                } else {
                    BGTool.sendMessage({
                        type: "verify",
                        data: $.extend({
                            userstatus: 1
                        }, currUserObj)
                    }, function() {});
                    getUserId(function(isGet, userId) {
                        if (isGet) {
                            BGTool.saveUser({
                                username: currUserObj.username,
                                password: currUserObj.password,
                                userId:userId
                            });
                        }
                    });
                }
                currUserObj.status = 1;
                break;
            }
        }
    }
}, {
    urls: [
        "<all_urls>"
    ]
}, [
    "blocking", "responseHeaders"
]);

function login(userObj) {
    $.post('http://172.18.1.48/seeyon/login/proxy', {
            "UserAgentFrom": "pc",
            "login.timezone": "",
            "login.username": userObj.username,
            "login.password": userObj.password,
            "authorization": "",
            "dogSessionId": ""
        },
        function(data) {

        });
}

function checkIslogin(callback) {
    $.get('http://172.18.1.48/seeyon/getAJAXMessageServlet', function(data) {
        if (/LOG/.test(data)) {
            callback(false);
        } else {
            callback(true);
        }
    });
}

function getUsername(callback) {
    callback = callback || function() {};
    $.get('http://172.18.1.48/seeyon/individual.do?method=managerFrame', function(data) {
        var usernameReg = /individualName"\s*value="([^"]*)/;
        if (usernameReg.test(data)) {
            callback(true, RegExp.$1);
        } else {
            callback(false);
        }
    });
}

function getUserId(callback) {
    callback = callback || function() {};
    $.get('http://172.18.1.48/seeyon/main.do?method=personalInfo', function(data) {
        var userIdReg = /memberId"\s*value="([^"]*)/;
        if (userIdReg.test(data)) {
            callback(true, RegExp.$1);
        } else {
            callback(false);
        }
    });
}

function showNotification(txtObj, callback) {
    console.log(txtObj);
    callback = callback || function() {};
    if (txtObj.priority == 'undefined') {
        txtObj.priority = 0;
    }
    chrome.notifications.create(txtObj.articleId, {
        type: "basic",
        title: txtObj.type,
        message: txtObj.title,
        iconUrl: "images/OAmsg.jpg",
        contextMessage: txtObj.pubtime + '   ' + txtObj.sender,
        buttons: [{
            title: "查看"
        }],
        priority: txtObj.priority,
        isClickable: true
    }, function(notificationId) {
        callback(notificationId);
    });
}
chrome.notifications.onClicked.addListener(function(id) {
    chrome.tabs.create({
        url: 'http://172.18.24.64:8080/file/' + id,
        active: true,
        pinned: false
    }, function(Cwindow) {

    });
});
chrome.notifications.onButtonClicked.addListener(function(id) {
    chrome.tabs.create({
        url: 'http://172.18.24.64:8080/file/' + id,
        active: true,
        pinned: false
    }, function(Cwindow) {});
});
/*BGTool.saveUser({
    username: "zhangyizhong",
    password: "zhangyizhong",
    sessionId: BGTool.sessionId()
});*/
