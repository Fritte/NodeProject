/**
 * Created by arved on 06.03.15.
 */
var express = require('express');

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

var serverPort = process.argv[2] || 3000;
app.use(express.static(__dirname + '/public'));


app.get('/', function(req, res){
    res.sendfile('index.html');
});

io.on('connection', function(socket){
    console.log('a user connected');
    socket.broadcast.emit('hello from new User', '@all');
});

http.listen(serverPort, function(){
    console.log('listening on port:'+serverPort);
});