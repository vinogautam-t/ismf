'use strict';

/**
 * @ngdoc function
 * @name yapp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of yapp
 */
angular.module('yapp')
  .controller('DashboardCtrl', function($scope, $timeout, $state, AuthService, $location, Session) {
    
  	if(!AuthService.isAuthenticated())
  		$location.path('/');

    $scope.$state = $state;

    $scope.user = Session.user;
    $scope.userObj = {};
    $scope.overview = {};
    $scope.eligilityAmount = 0;
    
    
    $scope.expense = {amount: 500};

    var query = firebase.database().ref('summary');
    query.on('value', function(snap) {
        $scope.overview = snap.val();
        
        $scope.eligilityAmount = parseInt(($scope.overview.savings / 4)/1000)*1000;
        
        if($scope.eligilityAmount > $scope.overview.balance){
          $scope.eligilityAmount = parseInt($scope.overview.balance/1000)*1000;
        }
        $scope.loanrequest = {amount: angular.copy($scope.eligilityAmount)};
        $scope.$apply();
    });
    
    $scope.loanrequest = {};
    
    $scope.users = [];
    
    var query = firebase.database().ref('users');
    query.once('value', function(snap) {
        if(snap.numChildren()){
          var res = snap.val();
          angular.forEach(res, function(v,k){
            v.id = k;
          	$scope.users.push(v);
          	$scope.userObj[k] = v;
          });
        }
        $scope.$apply();
    });

    $scope.menuItems = [];
    angular.forEach($state.get(), function (item) {
        if (item.data && item.data.visible) {
            $scope.menuItems.push({name: item.name, text: item.data.text});
        }
    });

    $scope.logout = function(){
    	Session.destroy();
    	$location.path('/');
    };
    
    $scope.transactions = {};
    
    firebase.database().ref('transaction').on('value', function(snap) {
        $scope.transactions = snap.val();
        $scope.$apply();
    });
    
    $scope.pendingtransactions = {};
    $scope.havePendingTransactions = 0;
    firebase.database().ref('pendingtransaction').on('value', function(snap) {
        $scope.havePendingTransactions = snap.numChildren();
        $scope.pendingtransactions = snap.val();
        $scope.$apply();
    });
    
    $scope.loanRequests = {};
    $scope.haveloanRequests = 0;
    firebase.database().ref('loanrequest').on('value', function(snap) {
        $scope.haveloanRequests = snap.numChildren();
        $scope.loanRequests = snap.val();
        $scope.$apply();
    });
    
    $scope.approveSaving = function(key, dt){
          
          $scope.overview.balance = parseInt(dt.amount) + parseInt($scope.overview.balance);
          firebase.database().ref('summary/balance').set($scope.overview.balance);
          
          $scope.overview.savings = parseInt(dt.amount) + parseInt($scope.overview.savings);
          firebase.database().ref('summary/savings').set($scope.overview.savings);
          
          dt.balance = $scope.overview.balance;
          dt.ts = new Date().getTime();
          dt.approved = 1;
          
          firebase.database().ref('transaction').push(dt);
          firebase.database().ref('pendingtransaction'+'/'+key).remove();
          
          $.notify("Payment Approved", "success");
    };
    
    $scope.declineSaving = function(key){
        firebase.database().ref('pendingtransaction'+'/'+key).remove();
        $.notify("Saving Request Declined", "success");
    };
    
    $scope.approveLoanRequest = function(k,v){
    };
    
    $scope.acceptLoanRequest = function(k,v){
      v.approved = v.approved ? v.approved : [];
      v.approved.push($scope.user.id);
      firebase.database().ref('loanrequest'+'/'+k+'/approved').set(v.approved);
      $.notify("You approved - "+$scope.userObj[v.user].name+" loan request", "success");
    };
    
    $scope.cancelLoanRequest = function(key){
        firebase.database().ref('loanrequest'+'/'+key).remove();
        $.notify("Your loan request Cancelled", "success");
    };

    $scope.paysavings = function() {
        $scope.expense.ts = new Date().getTime();
        $scope.expense.type = 'credit';
        $scope.expense.action = 'savings';
        $scope.expense.paid_by = angular.copy($scope.user.id);
        if($scope.user.isAdmin){
          $scope.overview.balance = parseInt($scope.expense.amount) + parseInt($scope.overview.balance);
          firebase.database().ref('summary/balance').set($scope.overview.balance);
          
          $scope.overview.savings = parseInt($scope.expense.amount) + parseInt($scope.overview.savings);
          firebase.database().ref('summary/savings').set($scope.overview.savings);
          
          $scope.expense.balance = $scope.overview.balance;
          firebase.database().ref('transaction').push($scope.expense);
          $.notify("Payment Submitted", "success");
        } else {
          $scope.expense.user = angular.copy($scope.user.id);
          $scope.expense.balance = $scope.overview.balance;
          firebase.database().ref('pendingtransaction').push($scope.expense); 
          $.notify("Payment Submitted, waiting for approval", "info");
        }
        
        $scope.expense = {amount: 500};
        
        $state.go('statement');
        
        return false;
    }
    
    $scope.newloadRequest = function(){
      $scope.loanrequest.ts = new Date().getTime();
      $scope.loanrequest.req_by = angular.copy($scope.user.id);
      $scope.loanrequest.approved = [];
      firebase.database().ref('loanrequest').push($scope.loanrequest);
      $.notify("Your loan request submitted", "info");
      $state.go('overview');
      
      $scope.loanrequest = {amount: angular.copy($scope.eligilityAmount)};
      
      return false;
    };

  });
