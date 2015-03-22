/**
 * Created by arved on 06.03.15.
 */
var express = require('express');

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var equal = require('deep-equal');
var path = require('path');
var request = require('request');

// Server keeps track of the last JSON get
var lastRequestJSON;

var apiAdresses = require('./lib/apiAdresses');
var constants = require('./lib/constants');

var matches = [];

var currentMatchDay;

var serverPort = process.argv[2] || 3000;
var fakeServerAddress = "http://localhost:3001";

request(fakeServerAddress + apiAdresses.CURRENT_MATCHDAY, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        var responseFromServer = JSON.parse(response.body);
        console.log(responseFromServer.GroupName);
        currentMatchDay = responseFromServer.GroupOrderId;
    } else {
        console.log(error);
        console.log('Error connecting to fake server \n Unable to fetch current match day');
    }
});

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
    res.sendfile('index.html');
});

io.on('connection', function (socket) {

    var resultsInterval = setInterval(function () {
        request(fakeServerAddress + apiAdresses.MATCH_DATA_OF_DAY + currentMatchDay, function (error, response, body) {
            var responseFromServer = JSON.parse(response.body);

            if(!equal(responseFromServer, lastRequestJSON)){
                console.log(response.body);
                lastRequestJSON = responseFromServer;
                //TODO: send Data

            }
        });
    }, constants.REFRESH_RATE_IN_SECONDS * 1000);

    socket.on('disconnect', function () {
        clearInterval(resultsInterval);
    });
});

http.listen(serverPort, function () {
    console.log('listening on port:' + serverPort);
});