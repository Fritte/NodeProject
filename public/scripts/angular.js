(function() {
	
	var BetYourFriends = angular.module('BetYourFriends', []);
	BetYourFriends.controller('matchController', function($scope, $rootScope) {
		$rootScope.loggedIn = false;
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
		});
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
		socket.on('send all matches', function(matches){
	        $scope.matches = matches;
	        for(i=0;i<matches.length;i++){
	        	//socket.emit('get bets', matches[i].matchId);
	        	//socket
	        	$scope.matches[i].bets = [];
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