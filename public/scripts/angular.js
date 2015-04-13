(function() {
	var BetYourFriends = angular.module('BetYourFriends', []);
	BetYourFriends.controller('matchController', function($scope) {
		var socket = io();
		this.placeBet = function(matchId, index) {
			var betDetails = {
					userName: 'Ahmed',//document.getElementById('userName').value,
					matchId: matchId,
					betAmount: document.getElementById('betAmount'+index).value,
					index: index
			};
		    socket.emit('place bet', betDetails);
		    //return false;
		};
		socket.on('send all matches', function(matches){
	        $scope.matches = matches;
	        for(i=0;i<matches.length;i++){
	        	$scope.matches[i].bets = [];
	        }
	        $scope.$apply();
	    });
		socket.on('show bet', function(betDetails){
			var bet = {
					userName: betDetails.userName,
					betAmount: betDetails.betAmount
			};
	        $scope.matches[betDetails.index].bets= ($scope.matches[betDetails.index].bets).concat(bet);//Update bet details in the table
	        $scope.$apply();
	    });
	});
})();