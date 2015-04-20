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
var mongoose = require('mongoose');

// Server keeps track of the last JSON get
var lastRequestJSON = [];

var apiAdresses = require('./lib/apiAdresses');
var constants = require('./lib/constants');
var testBets = require('./lib/test/testBets');

var matches = [];
var betsMatchMap = {};

var currentMatchDay;

var serverPort = process.argv[2] || 3000;
var fakeServerAddress = "http://localhost:3001";

mongoose.connect('mongodb://localhost/test');

// Connect with Mongo DB
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function(callback) {
	console.log('Connected');
});

// Make betTable Schema
var betTable = new mongoose.Schema({
	team1Goals : Number,
	team2Goals : Number,
	username : String,
	userId : Number,
	matchId : Number,
	amount : Number,
	index : Number,
	// Adding the time of bet here (By Mongoose instead of sending from client side)
	time : {
		type : Date,
		default : Date.now
	},
});

var userTable = new mongoose.Schema({
	username : String,
	userId : Number,
});

// Get betTable to call save or find function
var BetDB = mongoose.model('BetDB', betTable);

var UserDB = mongoose.model('UserDB', userTable);

// Universal callback function to debug everything on console
var callback = function(err, data) {
	if (err)
		return console.error(err);
	else
		console.log(data);
}
request(fakeServerAddress + apiAdresses.CURRENT_MATCHDAY, function(error, response, body) {
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

app.get('/', function(req, res) {
	res.sendfile('index.html');
});

io.on('connection', function(socket) {
	sendAllMatches(lastRequestJSON);
	var resultsInterval = setInterval(function() {
		request(fakeServerAddress + apiAdresses.MATCH_DATA_OF_DAY + currentMatchDay, function(error, response, body) {

			var listOfAllMatches = JSON.parse(response.body);
			if (!_.isEqual(listOfAllMatches, lastRequestJSON)) {
				// Calculate the order of bets for every match
				lastRequestJSON = _.map(listOfAllMatches, _.clone);
				listOfAllMatches.forEach(function(match) {
					// get only the names, and the amount of money, they have won
					var namesInOrder = _.map(calculateOrderOfBets(match), function(bet) {
						return {
							userId : bet.userId,
							username : bet.username,
							reward : bet.amount
						};
					});
					if (namesInOrder.length > 0) {
						namesInOrder[0].reward = 1.5 * namesInOrder[0].reward;
						for (var i = 1; i < namesInOrder.length; i++) {
							namesInOrder[i].reward = 0;
						}
					}
					match.namesInOrder = namesInOrder;
					console.log("Current result: " + match.MatchResults[0].PointsTeam1 + " : " + match.MatchResults[0].PointsTeam2);
					console.log(namesInOrder);
				});
				//console.log(lastRequestJSON);
				sendAllMatches(lastRequestJSON);
				//TODO: send Data
			}
		});
	}, constants.REFRESH_RATE_IN_SECONDS * 1000);

	socket.on('login', function(user){	
		UserDB.find({
			username : user.username
		}, function(err, data) {
			if (data.length == 1) {
				io.emit('loggedIn', data[0]);
			} else {
				newUser = {username: user.username,
					userId : Math.floor((Math.random() * 100000) + 1)}
				var newAccount = new UserDB(newUser);
				newAccount.save(function(err) {
					if (err)
						console.log(err);
					else {
						io.emit('loggedIn', newUser);
					}
				});
			}
		});
	});

	socket.on('place bet', function(betDetails) {
		if (validateBet(betDetails)) {
			BetDB.find({
				userId : betDetails.userId,
				matchId : betDetails.matchId
			}, function(err, data) {
				if (data.length >= 1) {
					//Send error to client
					console.log('you already bet');
				} else {
					var newBet = new BetDB(betDetails);
					newBet.save(function(err) {
						if (err)
							console.log(err);
						else {
							addBet(betDetails);
							io.emit('show bet', betDetails);
						}
					});
				}
			});
		} else {
			console.log('Invalidate');
			// Send error to client
		}
	});

	socket.on('disconnect', function() {
		clearInterval(resultsInterval);
	});
});

// Function to validate bet JSON obtained from client side
function validateBet(betDetails) {
	if ( typeof betDetails.team1Goals === 'undefined'
	 || typeof betDetails.team2Goals === 'undefined'
	 || typeof betDetails.userId === 'undefined')
		return false;
	else {
		if ( typeof betDetails.team1Goals === 'number'
		 || typeof betDetails.team2Goals === 'number'
		 || typeof betDetails.userId === 'number') {
			if (betDetails.team1Goals < 0 || betDetails.team2Goals < 0 || betDetails.userId < 0)
			  return false;
			else
			  return true;
		}
		else
			return false;
	}
}

// Sends the list of matches and bets to client side
function sendAllMatches(lastRequestJSON) {
	io.emit('send all matches', lastRequestJSON);
	for (var i = 0; i < lastRequestJSON.length; i++) {
		BetDB.find({
			matchId : lastRequestJSON[i].matchId
		}, function(err, data) {
			for (var j = 0; j < data.length; j++) {
				io.emit('show bet', data[j]);
			}
		});
	}
}

/**
 *
 * @param match: JSON of match
 */
function calculateOrderOfBets(match) {
	// List of bets on this match
	var bets = betsMatchMap[String(match.matchId)];
	var currentMatchResult = match.MatchResults[0];
	if ( typeof bets === 'undefined') {
		return [];
	}

	// List of bets for every possible outcome
	var betsTeam1Win = [];
	var betsTeam2Win = [];
	var betsTied = [];
	bets.forEach(function(bet) {
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
		return calculateBetsOrder(betsTeam1Win, currentMatchResult).concat(calculateBetsOrder(betsTeam2Win.concat(betsTied), currentMatchResult));
	} else if (currentMatchResult.PointsTeam1 === currentMatchResult.PointsTeam2) {
		return calculateBetsOrder(betsTied, currentMatchResult).concat(calculateBetsOrder(betsTeam2Win.concat(betsTeam1Win), currentMatchResult));
	} else {
		return calculateBetsOrder(betsTeam2Win, currentMatchResult).concat(calculateBetsOrder(betsTeam1Win.concat(betsTied), currentMatchResult));
	}
}

function calculateBetsOrder(bets, currentMatchResult) {
	// calculate the goal difference
	var goalDiffMap = _.map(bets, function(bet) {
		var diffGoals = Math.abs(bet.team1Goals - currentMatchResult.PointsTeam1) + Math.abs(bet.team2Goals - currentMatchResult.PointsTeam2);
		return {
			bet : bet,
			diffGoals : diffGoals
		};
	});
	var sortedGoalDiffMap = _.sortBy(goalDiffMap, 'diffGoals');
	return _.map(sortedGoalDiffMap, function(obj) {
		return obj.bet;
	});
}

/**
 * betsMatchApp provides an easy lookup for bets on match sorted by matchId
 *
 * @param New bet which should be added to betsMatchMao
 */
function addBet(bet) {
	if ( typeof betsMatchMap[String(bet.matchId)] === 'undefined') {
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

http.listen(serverPort, function() {
	console.log('listening on port:' + serverPort);
	init();
}); 