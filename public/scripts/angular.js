(function() {
	var mobility_services = angular.module('Mobility Services', []);
	mobility_services.controller('matchController', function($scope, $http) {
		$scope.status = "";
		this.placeBet = function() {
			var dataObj = {
				betAmount : document.getElementById('betAmount').value
			};
			$http({
				url : '/placeBet/'+betAmount,
				method : "GET",
				data : dataObj,
				headers : {
					'Content-Type' : 'application/json',
					'Accept' : 'application/json'
				}
			}).success(function(data, status, headers, config) {
				$scope.status= "Here are your matches";
			}).error(function(data, status, headers, config) {
				$scope.status = "Error occured. Please try again later.";
			});
		};
	});
})();