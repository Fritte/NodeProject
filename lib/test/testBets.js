/**
 * These are test bets on the first match, only for testing purpose
 */
module.exports = Object.freeze({
    bets: (function(){
        var testBet1 = 	{
            amount : 10,
            team1Goals : 1,
            team2Goals : 1,
            username : "Ahmed",
            userId : 0,
            matchId : 0,
            time : "2015-04-13T09:24:59.602Z"
        };
        var testBet2 = {
            amount : 100,
            team1Goals : 2,
            team2Goals : 3,
            username : "Arved",
            userId : 1,
            matchId : 0,
            time : "2015-04-13T09:24:59.602Z"
        };
        var testBet3 = {
            amount : 20,
            team1Goals : 2,
            team2Goals : 0,
            username : "Hans",
            userId : 2,
            matchId : 0,
            time : "2015-04-13T09:24:59.602Z"
        };
        return [testBet1, testBet2, testBet3];
    })()
});
