var socket = io.connect('http://localhost:8080');
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
        if (typeof value == "object") {
            value = JSON.stringify(value);
        }
        localStorage[key] = value;
    },
    sendMessage: function(data, callback) {
        chrome.runtime.sendMessage(data,
            function(data) {
                callback(data);
            });
    },
    sessionId: function() {
        return window.btoa(Date.now() + "R" + Math.random()).replace(/=*$/g, '');
    },
    saveUser: function(obj) {
        socket.on("connect",function() {
            console.log(obj);
            socket.emit("saveUserReq", obj);
        });

    }
};

var i = 1;
var lastId;
//currUserObj status:1 成功 2 验证失败 3 正在验证 4 后台自动登录 5 数据库连接中
var currUserObj = {
    status: 5
};
socket.on('connect', function() {
    var userObj = BGTool.storageget('user');
    if (userObj.name) {
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
        console.log(currUserObj);
        BGTool.sendMessage({
            type: "init",
            data: currUserObj
        }, function(data) {});
        init();
    }
    lastId = 1;
    socket.emit("serverstatus", lastId);
    socket.on("clientstatus", function(data) {
        console.log("lastId" + data);
    });
});

function init() {

}
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.log(message);
    if (message.type == 'verify') {
        currUserObj = $.extend({
            status: 3
        }, message.data);
        login(currUserObj);
    } else if (message.type == 'autologin') {
        currUserObj.status = 4;
        login(currUserObj);
    } else if (message.type == 'getinfo') {
        sendResponse(currUserObj);
    } else if (message.type == 'logout') {
        currUserObj = {};
        localStorage.removeItem('user');
        sendResponse("ok");
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
                console.log(currUserObj);
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
                    BGTool.storageset('user', {
                        name: currUserObj.username,
                        cookie: '123'
                    });
                }
                /*BGTool.saveUser({
                    username: currUserObj.username,
                    password: currUserObj.password,
                    sessionId:BGTool.sessionId()
                });*/
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
            "login.username": "zhangyizhong",
            "login.password": "zhangyizhong",
            "authorization": "",
            "dogSessionId": ""
        },
        function(data) {

        });
}

function showNotification(txtObj, callback) {
    console.log(txtObj)
    if (txtObj.priority == 'undefined') {
        txtObj.priority = 0;
    }
    chrome.notifications.create({
        type: "basic",
        title: txtObj.type,
        message: txtObj.text,
        iconUrl: "images/icon-128.png",
        contextMessage: txtObj.asidetxt,
        buttons: [{
            title: "查看"
        }],
        priority: txtObj.priority,
        isClickable: true
    }, function(notificationId) {
        callback(notificationId);
    });
}
chrome.notifications.onButtonClicked.addListener(function(id) {
    console.log(id);
});
BGTool.saveUser({
    username: "zhangyizhong",
    password: "zhangyizhong",
    sessionId: BGTool.sessionId()
});
