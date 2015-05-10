 var i = 1;
 var socket = io.connect('http://localhost:8080');
 var lastId;
 socket.on('connect', function() {
     lastId = 1;
     socket.emit("serverstatus", lastId);
     socket.on("clientstatus", function(data) {
         console.log("lastId" + data);
     });
 });
 chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
     if (message.type == 'verify') {
         console.log("verify");
         sendResponse("ok");
         showNotification({
             type: "公告",
             text: "关于胡鑫同志任前公示的公告",
             asidetxt: "2015-05-08 16:18 彭谆 ",
             priority: 2
         }, function(notificationId) {

         });
         $.get('http://www.baidu.com', function(data) {

         });
     } else if (message.type == 'getinfo') {

     }
 });
 $.get('http://www.baidu.com', function(data) {

 });
 chrome.webRequest.onBeforeSendHeaders.addListener(function(details) {
     console.log(details);
     for (var i = 0, headerLen = details.requestHeaders.length; i < headerLen; ++i) {
         if (details.requestHeaders[i].name == 'User-Agent') {
             details.requestHeaders.splice(i, 1);
             break;
         }
     }
     return {
         requestHeaders: details.requestHeaders
     };
 }, {
     urls: [
         "<all_urls>"
     ]
 }, [
     "blocking",
     "requestHeaders"
 ]);

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
