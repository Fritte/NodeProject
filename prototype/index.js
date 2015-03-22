var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  socket.on('get matches', function(){
	  //get match data from fake API
	  var matchId = "someID";
    io.emit('send matches', matchId);
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
