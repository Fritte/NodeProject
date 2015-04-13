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
	
	//Using 2 matches as test data
	 /*var match = 
     [{
         TimeZoneID: "W. Europe Standard Time",
         matchId: 1,
         Location: null,
         NumberOfViewers: null,
         Team1: {
             TeamId: 40,
             TeamName: "Bayern MÃ¼nchen",
             TeamIconUrl: "http://www.openligadb.de/images/teamicons/Bayern_Muenchen.gif"
         },
         Team2: {
             TeamId: 7,
             TeamName: "Borussia Dortmund",
             TeamIconUrl: "http://www.openligadb.de/images/teamicons/Borussia_Dortmund.gif"
         },
         MatchDateTimeUTC: "2015-03-22T11:17:01.072Z",
         MatchDateTime: "2015-03-22T11:17:01.072Z",
         MatchDateEndTimeUTC: "2015-03-22T11:17:01.072Z",
         MatchDateEndTime: "2015-03-22T11:17:01.072Z",
         MatchID: 0,
         MatchIsFinished: false,
         MatchIsRunning: true,
         MatchResults: [
             {
                 ResultID: 0,
                 ResultName: "Endergebnis",
                 PointsTeam1: 0,
                 PointsTeam2: 3,
                 ResultOrderID: 1,
                 ResultDescription: "Ergebnis nach Ende der offiziellen Spielzeit"
             },
             {
                 ResultID: 1,
                 ResultName: "Halbzeitergebnis",
                 PointsTeam1: 0,
                 PointsTeam2: 0,
                 ResultOrderID: 2,
                 ResultDescription: "Ergebnis nach Ende der ersten Halbzeit"
             }
         ]
     },
     {
         TimeZoneID: "W. Europe Standard Time",
         matchId: 2,
         Location: null,
         NumberOfViewers: null,
         Team1: {
             TeamId: 40,
             TeamName: "Bayern MÃ¼nchen",
             TeamIconUrl: "http://www.openligadb.de/images/teamicons/Bayern_Muenchen.gif"
         },
         Team2: {
             TeamId: 7,
             TeamName: "Borussia Dortmund",
             TeamIconUrl: "http://www.openligadb.de/images/teamicons/Borussia_Dortmund.gif"
         },
         MatchDateTimeUTC: "2015-03-22T11:17:01.072Z",
         MatchDateTime: "2015-03-22T11:17:01.072Z",
         MatchDateEndTimeUTC: "2015-03-22T11:17:01.072Z",
         MatchDateEndTime: "2015-03-22T11:17:01.072Z",
         MatchID: 0,
         MatchIsFinished: false,
         MatchIsRunning: true,
         MatchResults: [
             {
                 ResultID: 0,
                 ResultName: "Endergebnis",
                 PointsTeam1: 0,
                 PointsTeam2: 3,
                 ResultOrderID: 1,
                 ResultDescription: "Ergebnis nach Ende der offiziellen Spielzeit"
             },
             {
                 ResultID: 1,
                 ResultName: "Halbzeitergebnis",
                 PointsTeam1: 0,
                 PointsTeam2: 0,
                 ResultOrderID: 2,
                 ResultDescription: "Ergebnis nach Ende der ersten Halbzeit"
             }
         ]
     }];
	io.emit('send all matches', match);
	*/
	
    var resultsInterval = setInterval(function () {
        request(fakeServerAddress + apiAdresses.MATCH_DATA_OF_DAY + currentMatchDay, function (error, response, body) {
            var responseFromServer = JSON.parse(response.body);
           
            if(!equal(responseFromServer, lastRequestJSON)){
                console.log(response.body);
                lastRequestJSON = responseFromServer;
                io.emit('send all matches', lastRequestJSON);
                //TODO: send Data
            }
        });
    }, constants.REFRESH_RATE_IN_SECONDS * 1000);

    socket.on('place bet', function(betDetails){
        //TODO: persisting bets on server, ranking algo
    	
    	io.emit('show bet', betDetails);
    });
    
    socket.on('disconnect', function () {
        clearInterval(resultsInterval);
    });
});

http.listen(serverPort, function () {
    console.log('listening on port:' + serverPort);
});