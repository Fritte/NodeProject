/**
 * The test server randomly chooses two of the following teams, which should play against each other
 **/
module.exports = Object.freeze({
    bundesligaTeams : (function(){
        var team1 = {
            "TeamId": 40,
            "TeamName": "Bayern München",
            "TeamIconUrl": "http://www.openligadb.de/images/teamicons/Bayern_Muenchen.gif"
        };
        var team2 = {
            "TeamId": 7,
            "TeamName": "Borussia Dortmund",
            "TeamIconUrl": "http://www.openligadb.de/images/teamicons/Borussia_Dortmund.gif"
        };
        return [team1, team2];
    })()
});