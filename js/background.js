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
    }
};

var i = 1;
var socket = io.connect('http://localhost:8080');
var lastId;
var currUserObj;
socket.on('connect', function() {
    var userObj = BGTool.storageget('user');
    if (userObj) {
        socket.emit("getInfoReq", userObj);
        socket.on('getInfoRes', function(data) {
            if (data.password != undefined) {
                currUserObj = data;
            } else {
                currUserObj = {};
            }
        });
    } else {
        currUserObj = {};
    }
    lastId = 1;
    socket.emit("serverstatus", lastId);
    socket.on("clientstatus", function(data) {
        console.log("lastId" + data);
    });
});
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.type == 'verify') {
        currUserObj = message.data;
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
                            data: 2
                        });
                        break;
                    case '1':
                        BGTool.sendMessage({
                            type: "verify",
                            data: 3
                        });
                        break;
                }
            } else if (details.responseHeaders[i].name == 'LoginOK') {
                BGTool.sendMessage({
                    type: "verify",
                    data: 1
                });
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
