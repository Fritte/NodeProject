var socket = io();
      $('form').submit(function(){
        socket.emit('get matches');
        return false;
      });
      socket.on('send matches', function(msg){
        $('#messages').append($('<li>').text(msg));
      });