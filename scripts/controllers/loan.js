'use strict';

/**
 * @ngdoc function
 * @name yapp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of yapp
 */
angular.module('yapp')
.controller('LoanCtrl', function($scope, $timeout, $state, AuthService, $location, Session) {
	$scope.myloan = {};
	firebase.database().ref('loanrequest/'+$state.params.id).on('value', function(snap) {
		$scope.myloan = snap.val();
	});
});