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
var _ = require('underscore');

// Server keeps track of the last JSON get
var lastRequestJSON;

var apiAdresses = require('./lib/apiAdresses');
var constants = require('./lib/constants');
var testBets = require('./lib/test/testBets');

var matches = [];
var betsMatchMap = {};

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

            var listOfAllMatches = JSON.parse(response.body);
            if (!_.isEqual(listOfAllMatches, lastRequestJSON)) {
                // Calculate the order of bets for every match
                lastRequestJSON = _.map(listOfAllMatches, _.clone);

                listOfAllMatches.forEach(function (match) {
                    // get only the names, and the amount of money, they have won
                    var namesInOrder = _.map(calculateOrderOfBets(match), function(bet){
                        return {userId : bet.userId, username : bet.username, reward : bet.amount};
                    });
                    if(namesInOrder.length > 0){
                        namesInOrder[0].reward = 1.5 * namesInOrder[0].reward;
                        for(var i = 1; i< namesInOrder.length; i++){
                            namesInOrder[i].reward = 0;
                        }
                    }
                    match.namesInOrder = namesInOrder;
                    console.log("Current result: " +
                        match.MatchResults[0].PointsTeam1 + " : " +
                        match.MatchResults[0].PointsTeam2);
                    console.log(namesInOrder);
                });
                io.emit('send all matches', lastRequestJSON);
                //TODO: send Data
            }
        });
    }, constants.REFRESH_RATE_IN_SECONDS * 1000);

    socket.on('place bet', function (betDetails) {
        //TODO: persisting bets on server, ranking algo
        io.emit('show bet', betDetails);
    });

    socket.on('disconnect', function () {
        clearInterval(resultsInterval);
    });
});

/**
 *
 * @param match: JSON of match
 */
function calculateOrderOfBets(match) {
    // List of bets on this match
    var bets = betsMatchMap[String(match.matchId)];
    var currentMatchResult = match.MatchResults[0];
    if (typeof bets === 'undefined') {
        return [];
    }

    // List of bets for every possible outcome
    var betsTeam1Win = [];
    var betsTeam2Win = [];
    var betsTied = [];
    bets.forEach(function (bet) {
        if (bet.team1Goals > bet.team2Goals) {
            betsTeam1Win.push(bet);
        } else if (bet.team1Goals === bet.team2Goals) {
            betsTied.push(bet);
        } else {
            betsTeam2Win.push(bet);
        }
    });

    // calculate the order
    if (currentMatchResult.PointsTeam1 > currentMatchResult.PointsTeam2) {
        return calculateBetsOrder(betsTeam1Win, currentMatchResult).
            concat(calculateBetsOrder(betsTeam2Win.concat(betsTied), currentMatchResult));
    } else if (currentMatchResult.PointsTeam1 === currentMatchResult.PointsTeam2) {
        return calculateBetsOrder(betsTied, currentMatchResult).
            concat(calculateBetsOrder(betsTeam2Win.concat(betsTeam1Win), currentMatchResult));
    } else {
        return calculateBetsOrder(betsTeam2Win, currentMatchResult).
            concat(calculateBetsOrder(betsTeam1Win.concat(betsTied), currentMatchResult));
    }
}

function calculateBetsOrder(bets, currentMatchResult) {
    // calculate the goal difference
    var goalDiffMap = _.map(bets, function (bet) {
        var diffGoals = Math.abs(bet.team1Goals - currentMatchResult.PointsTeam1) +
            Math.abs(bet.team2Goals - currentMatchResult.PointsTeam2);
        return {bet: bet, diffGoals: diffGoals};
    });
    var sortedGoalDiffMap = _.sortBy(goalDiffMap, 'diffGoals');
    return _.map(sortedGoalDiffMap, function (obj) {
        return obj.bet;
    });
}

/**
 * betsMatchApp provides an easy lookup for bets on match sorted by matchId
 *
 * @param New bet which should be added to betsMatchMao
 */
function addBet(bet) {
    if (typeof betsMatchMap[String(bet.matchId)] === 'undefined') {
        betsMatchMap[String(bet.matchId)] = [];
    }
    betsMatchMap[String(bet.matchId)].push(bet);
}

/**
 * init method is called on startup of server
 */
function init() {
    for (var i = 0; i < testBets.bets.length; i++) {
        addBet(testBets.bets[i]);
    }
    console.log(JSON.stringify(betsMatchMap));
}

http.listen(serverPort, function () {
    console.log('listening on port:' + serverPort);
    init();
});