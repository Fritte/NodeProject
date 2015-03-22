/**
 * Created by arved on 06.03.15.
 */
var express = require('express');

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var request = require('request');

var apiAdresses = require('./lib/apiAdresses');
var constants = require('./lib/constants');

var matches = [];

var currentMatchDay;

var serverPort = process.argv[2] || 3000;
var fakeServerAddress = "http://localhost:3001";

request(fakeServerAddress+apiAdresses.CURRENT_MATCHDAY, function(error, response, body){
    if (!error && response.statusCode == 200) {
        var responseFromServer = JSON.parse(response.body);
        console.log(responseFromServer.GroupName);
        currentMatchDay = responseFromServer;
    } else{
        console.log(error);
        console.log('Error connecting to fake server \n Unable to fetch current match day');
    }
});

/**
 * Refreshes the match results every x seconds
 * Send them to client if something has changed
 */
setInterval(function(){
}, constants.REFRESH_RATE_IN_SECONDS * 1000);

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
    res.sendfile('index.html');
});

io.on('connection', function(socket){
    socket.on('get matches', function(){
        //get match data from fake API

        //TODO: Ajax get to fake server
        //Pass currently running matches with event 'send matches'

        var matchId = "someID";
        io.emit('send matches', matchId);
    });
});

http.listen(serverPort, function(){
    console.log('listening on port:'+serverPort);
});