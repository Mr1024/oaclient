 var i = 1;
 var socket = io.connect('http://172.18.24.64:8080');
 socket.on('connect', function() {
     socket.on('message', function(message) {
       $("ul").append("<li>"+message+"</li>");
     });
     socket.on('disconnect', function() {
         console.log("close");
     });
     setInterval(function() {
         socket.send(i++);
     }, 1000);

 });
