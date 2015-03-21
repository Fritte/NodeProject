/**
 * This is a fake server to generate JSON
 *
 * For the purpose of demonstration this server generates data in the format of http://www.openligadb.de/
 */
var express = require('express');
var app = express();
var moment = require('moment');

var serverPort = process.argv[2] || 3001;
var serverAddress = "localhost:" + serverPort;

var nextMatchId = 0;
var nextResultId = 0;

var homeTeam = {
    "TeamId": 40,
    "TeamName": "Bayern München",
    "TeamIconUrl": "http://www.openligadb.de/images/teamicons/Bayern_Muenchen.gif"
};
var awayTeam = {
    "TeamId": 7,
    "TeamName": "Borussia Dortmund",
    "TeamIconUrl": "http://www.openligadb.de/images/teamicons/Borussia_Dortmund.gif"
};

var awayTeamGoals;
var homeTeamGoals;

// currently running matchTemplate
var matchTemplate = {
    'TimeZoneID': 'W. Europe Standard Time',
    "matchId": 0,
    "Location": null,
    "NumberOfViewers": null,
    "Team1": homeTeam,
    "Team2": awayTeam
};

var matches = [];
var numMatchDay = 0;

app.get('/api/getcurrentgroup/bl1', function (req, res) {
    var matchday = {
        'GroupName': numMatchDay + ". Spieltag",
        'GroupOrderId': numMatchDay,
        'GroupID': 14588
    };

    res.send(JSON.stringify(matchday, null, 4));
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
app.get('/api/startMatch', function (req, res) {
    console.log(req.query);
    if (typeof req.query.lengthMatch == 'undefined') {
        res.status(400).send('Missing Parameter lengthMatch (in seconds)!');
        return;
    }

    // Reset goals
    awayTeamGoals = 0;
    homeTeamGoals = 0;

    var now = moment();
    var startDate;
    if (typeof req.query.beginDate == 'undefined') {
        startDate = moment();
    } else {
        startDate = moment(req.query.beginDate);
    }

    if (now.isAfter(startDate)) {
        res.status(400).send('The start Date has to be in the future!');
    }

    var endDate = startDate.add(moment.duration(req.query.lengthMatch, 'seconds'));
    var match = addMatch(startDate, endDate);

    // start match
    setTimeout(function () {
        console.log('Match has started');
        match['MatchIsFinished'] = false;
        match['MatchIsRunning'] = true;

        var refreshIntervalId = setInterval(function(){
            console.log("Random event");
        }, 1000);

        // end match
        setTimeout(function () {
            // Template is finished after x seconds
            clearInterval(refreshIntervalId);
            match['MatchIsFinished'] = true;
            match['MatchIsRunning'] = false;
            console.log("Match has finished");
        }, req.query.lengthMatch * 1000);
    }, moment.duration(now.diff(startDate)).asMilliseconds());

    res.sendStatus(200);
});

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
    match['MatchDateTimeUTC'] = startDate.utc();
    match['MatchDateTime'] = startDate;
    match['MatchDateEndTimeUTC'] = endDate.utc();
    match['MatchDateEndTime'] = endDate;
    match['MatchID'] = nextMatchId++;
    match['MatchIsFinished'] = false;
    match['MatchIsRunning'] = false;
    matches.push(match);

    match['MatchResults'] = [{
        'ResultID': nextResultId,
        "ResultName": "Endergebnis",
        "PointsTeam1": null, "PointsTeam2": null,
        "ResultOrderID": 1,
        "ResultDescription": "Ergebnis nach Ende der offiziellen Spielzeit"
    }, {
        'ResultID': nextResultId + 1,
        "ResultName": "Halbzeitergebnis",
        "PointsTeam1": null, "PointsTeam2": null,
        "ResultOrderID": 2,
        "ResultDescription": "Ergebnis nach Ende der ersten Halbzeit"
    }];
    nextResultId += 2;
    return match;
}

app.listen(serverPort);