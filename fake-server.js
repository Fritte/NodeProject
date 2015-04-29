/**
 * This is a fake server to generate JSON
 *
 * For the purpose of demonstration this server generates data in the format of http://www.openligadb.de/
 */
var express = require('express');
var app = express();
var moment = require('moment');
var find = require('array-find');
var random = require("random-js")();
var moment = require('moment');

var teams = require('./lib/fakeServer/teams');
var constants = require('./lib/constants');

var serverPort = process.argv[2] || 3001;
var serverAddress = "localhost:" + serverPort;

var nextMatchId = 0;
var nextResultId = 0;

var awayTeamGoals;
var homeTeamGoals;

// currently running matchTemplate
var matchTemplate = {
    'TimeZoneID': 'W. Europe Standard Time',
    "Location": null,
    "NumberOfViewers": null,
    // "Team1": teams.bundesligaTeams[0],
    // "Team2": teams.bundesligaTeams[1]
};

var matches = [];
var numMatchDay = 0;

app.get('/api/getcurrentgroup/bl1', function (req, res) {
    var matchday = {
        'GroupName': numMatchDay + ". Spieltag",
        'GroupOrderId': numMatchDay,
        'GroupID': 14588
    };
    res.send(JSON.stringify(matchday));
});

/**
 * get all matches of the current matchDay
 * In our case these are all matches registered
 */
app.get('/api/getmatchdata/bl1/2014/0', function (req, res) {
    res.send(JSON.stringify(matches, null, 4));
});

/**
 * Trigger a virtual game
 * For demonstration purpose only
 *
 * lengthMatch: Length of matchTemplate in seconds
 * beginDate: Start time of the match, if not specified the match starts now
 * The date has to be specified in UTC format YYYY-MM-DDTHH:MM:SSZ
 */
function startMatch(req, res, match, startDate, endDate) {
    // start match
    var now = moment();
    setTimeout(function () {
        console.log('Match has started');
        match['MatchIsFinished'] = false;
        match['MatchIsRunning'] = true;

        var refreshIntervalId = setInterval(function () {
            // Goal
            var r = Math.random();
            if (r < 0.5) {
                // Goal for away team
                var endResult = find(match.MatchResults, function (element, index, arr) {
                    return element.ResultOrderID == 1;
                });
                // assign a goal randomly
                if (r < 0.25) {
                    endResult.PointsTeam1 += 1;
                } else {
                    endResult.PointsTeam2 += 1;
                }
            }
        }, constants.RANDOM_EVENT_IN_SECONDS * 1000);

        // end match
        setTimeout(function () {
            // Template is finished after x seconds
            clearInterval(refreshIntervalId);
            match['MatchIsFinished'] = true;
            match['MatchIsRunning'] = false;
            console.log("Match has finished");
        }, req.query.lengthMatch * 1000);
    }, moment.duration(now.diff(startDate)).asMilliseconds());
}

function startMatchInXSeconds(x) {
    return function (req, res) {
        console.log(req.query.lengthMatch);
        if (typeof req.query.lengthMatch === 'undefined') {
            res.status(400).send('Missing Parameter lengthMatch (in seconds)!');
            return;
        }
        awayTeamGoals = 0;
        homeTeamGoals = 0;

        var startDate = moment().add(x, 's');
        /**
        if (typeof req.query.beginDate == 'undefined') {
            startDate = moment();
        } else {
            startDate = moment(req.query.beginDate);
        }


        if (now.isAfter(startDate)) {
            res.status(400).send('The start Date has to be in the future!');
        }
         **/

        var endDate = moment(startDate).add(10, 's');
        var match = addMatch(startDate, endDate);
        setTimeout(function () {
            startMatch(req, res, match, startDate, endDate);
        }, x * 1000);
        res.sendStatus(200);
    };
}

app.get('/api/startMatch', startMatchInXSeconds(0));
app.get('/api/startMatchInThirtySeconds', startMatchInXSeconds(30));
app.get('/api/startMatchInOneMinute', startMatchInXSeconds(60));
app.get('/api/startMatchInTwoMinutes', startMatchInXSeconds(120));
app.get('/api/startMatchInFiveMinutes', startMatchInXSeconds(300));


function clone(a) {
    return JSON.parse(JSON.stringify(a));
}

/**
 * Add a new match to the list
 * returns the new match
 * @param startDate
 * @param endDate
 * @returns {number}
 */
function addMatch(startDate, endDate) {
    var match = clone(matchTemplate);
    // get random teams
    var firstTeam = random.integer(0, teams.bundesligaTeams.length - 1);
    var secondTeam;
    do {
        secondTeam = random.integer(0, teams.bundesligaTeams.length - 1);
    } while (secondTeam === firstTeam);
    match['Team1'] = teams.bundesligaTeams[firstTeam];
    match['Team2'] = teams.bundesligaTeams[secondTeam];

    match['MatchDateTimeUTC'] = startDate.utc();
    match['MatchDateTime'] = moment(moment.utc(startDate).toDate()).format('YYYY-MM-DD HH:mm:ss')
    match['MatchDateEndTimeUTC'] = endDate.utc();

    match['MatchDateEndTime'] = moment(moment.utc(endDate).toDate()).format('YYYY-MM-DD HH:mm:ss');
    match['matchId'] = nextMatchId;
    match['MatchIsFinished'] = false;
    match['MatchIsRunning'] = false;

    match['MatchResults'] = [{
        'ResultID': nextResultId,
        "ResultName": "Endergebnis",
        "PointsTeam1": 0, "PointsTeam2": 0,
        "ResultOrderID": 1,
        "ResultDescription": "Ergebnis nach Ende der offiziellen Spielzeit"
    }, {
        'ResultID': nextResultId + 1,
        "ResultName": "Halbzeitergebnis",
        "PointsTeam1": 0, "PointsTeam2": 0,
        "ResultOrderID": 2,
        "ResultDescription": "Ergebnis nach Ende der ersten Halbzeit"
    }];

    matches.push(match);
    nextResultId += 2;
    nextMatchId++;
    return match;
}

app.listen(serverPort);
