'use strict';

/**
 * @ngdoc function
 * @name yapp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of yapp
 */
angular.module('yapp')
  .controller('LoginCtrl', function($scope, Session, $location, AUTH_REDIRECT, AuthService) {

  	if(AuthService.isAuthenticated())
  		$location.path('/dashboard');
    
    $scope.login = {};
    
    $scope.submit = function() {

      	var query = firebase.database().ref('users').orderByChild('phone').equalTo($scope.login.mobile);
        query.once('value', function(snap) {
            if(snap.numChildren() == 1){
              var res = snap.val();
              var dataa;
              angular.forEach(res, function(v,k){
              	dataa = v;
              	dataa.id = k;
              });
              if(dataa.password == $scope.login.password){
                  Session.create(dataa, true);
  					      $location.path('/dashboard');
              }
            }
            $scope.$apply();
        });

      return false;
    }

  });
