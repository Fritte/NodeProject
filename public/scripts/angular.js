(function() {
	var BetYourFriends = angular.module('BetYourFriends', []);
	BetYourFriends.controller('matchController', function($scope) {
		var socket = io();
		this.placeBet = function(matchId, index) {
			var betDetails = {
					username: 'pro1',//document.getElementById('userName').value,
					userId: 1,
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
					amount: betDetails.amount
			};
	        $scope.matches[betDetails.index].bets= ($scope.matches[betDetails.index].bets).concat(bet);//Update bet details in the table
	        $scope.$apply();
	    });
	});
})();