(function() {
	
	var BetYourFriends = angular.module('BetYourFriends', []);
    BetYourFriends.controller('betController', function($scope, $rootScope){
        var socket = io();
        
        var divCurrentTime = $('.currentTime');
            	var currentTime;
            	setInterval(function(){
            		currentTime = moment.utc();
            		currentTime = moment(currentTime).toDate();
    				divCurrentTime.html("<b>Current Time: </b>"+moment(currentTime).format('YYYY-MM-DD HH:mm:ss'));
            	},1000);
        
        this.placeBet = function(matchId, index) {
            var betDetails = {
                username: $rootScope.username,//document.getElementById('userName').value,
                userId: $rootScope.userId,
                matchId: matchId,
                amount: document.getElementById('betAmount'+index).value,
                index: index,
                team1Goals: parseInt(document.getElementById('t1Goals'+index).value),
                team2Goals: parseInt(document.getElementById('t2Goals'+index).value)
            };
            socket.emit('place bet', betDetails);
            //return false;
        };
    });

	BetYourFriends.controller('matchController', function($scope, $rootScope) {
		$rootScope.loggedIn = false;
		var matchStartTime;
        var _username;
        var _userId;
		var socket = io();
		$scope.user = {username: ""};
		this.login = function(){
			socket.emit('login', $scope.user);
		};
		socket.on('loggedIn', function(user){
			$rootScope.username = $scope.user.username;
			$rootScope.userId = user.userId;
			$rootScope.loggedIn = true;	
			$scope.$apply();
            _username = $scope.user.username;
            _userId = user.userId;
		});

        this.isBetAllowed = function(match){
            var now = moment();
            var matchBegin = moment(match.MatchDateTime);
            return matchBegin.isAfter(now);
        };

		socket.on('send all matches', function(matches){
            console.log("send all matches called");
            console.log(matches);
	        for(i=0;i<matches.length;i++){
	        	matchStartTime = moment.utc(matches[i].MatchDateTime).toDate();
            	matches[i].MatchDateTime = moment(matchStartTime).format('YYYY-MM-DD HH:mm:ss');
	        	//$scope.matches[i].bets = [];
	        }
	        $scope.matches = matches;
	    });
        socket.on('matchInfoChanged', function(match){
            var x = true;
            console.log($scope.matches);
            
            for(var i=0; i<$scope.matches.length; i++){
                // update match, if already existing
                if($scope.matches[i].matchId === match.matchId){
                    console.log("updated!");   
                    $scope.matches[i].MatchResults[0].PointsTeam1 = match.MatchResults[0].PointsTeam1;
                    $scope.matches[i].MatchResults[0].PointsTeam2 = match.MatchResults[0].PointsTeam2;
                    $scope.matches[i].bets = match.bets;
                    $scope.matches[i].MatchIsFinished = match.MatchIsFinished;
                    $scope.matches[i].MatchIsRunning = match.MatchIsRunning;
                    x = false;
                    break;
                }
            }
            // if match does not already exit add it to the List
            if(x) {
            	matchStartTime = moment.utc(match.MatchDateTime).toDate();
            	match.MatchDateTime = moment(matchStartTime).format('YYYY-MM-DD HH:mm:ss');
                $scope.matches.push(match);
            }
            $scope.$apply();
        });

		socket.on('show bet', function(betDetails){
			var bet = {
					username: betDetails.username,
					amount: betDetails.amount,
					team1Goals: betDetails.team1Goals,
					team2Goals: betDetails.team2Goals
			};
	        $scope.matches[betDetails.index].bets= ($scope.matches[betDetails.index].bets).concat(bet);//Update bet details in the table
            $scope.$apply();
	    });
	});
})();