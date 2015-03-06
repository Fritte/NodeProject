/**
 * Created by arved on 06.03.15.
 */

var socket = io()

socket.on('hello from new User', function(socket){
    console.log('New User Connected');
});