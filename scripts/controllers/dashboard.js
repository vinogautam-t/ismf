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

    $scope.report = {};
    
    $scope.saveData = function(tr, k) {
      firebase.database().ref('transaction/'+k+'/user/').set(tr.user);
      firebase.database().ref('transaction/'+k+'/notes/').set(tr.notes);
      firebase.database().ref('transaction/'+k+'/ts/').set(new Date(tr.dt).getTime());
    }

    $scope.reportDetails = function(id){
      if(id === undefined){
        $scope.report.user = angular.copy($scope.user.id);
      }

      $scope.report.transactions = [];
      firebase.database().ref('transaction').orderByChild('user').equalTo($scope.report.user).on('value', function(snap) {
        $scope.report.transactions = snap.val();
        $scope.$apply();
      });
    };
    
    $scope.currentTime = new Date().getTime();
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
    
    firebase.database().ref('transaction').limitToLast(50).on('value', function(snap) {
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
    $scope.activeloans = {};
    $scope.closed_loans = {};
    $scope.haveloanRequests = 0;
    firebase.database().ref('loanrequest').on('value', function(snap) {
        
        var loanRequests = snap.val();
        $scope.loanRequests = {};
        $scope.activeloans = {};
        $scope.closed_loans = {};
        $scope.haveloanRequests = 0;
        angular.forEach(loanRequests, function(v,k) {
            if(v.loan_status == 0){
              $scope.loanRequests[k] = v;
              $scope.haveloanRequests++;
            } else if(v.loan_status == 1){
              $scope.activeloans[k] = v;
            } else if(v.loan_status == 2){
              $scope.closed_loans[k] = v;
            }
        });
        
        
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
    
    $scope.pageInfo = {user_id: 0};
    
    $scope.approveLoanRequest = function(k,v){
        firebase.database().ref('loanrequest'+'/'+k+'/loan_status').set(1);
        $scope.newloan = {ref: k};
        $scope.newloan.ts = new Date().getTime();
        $scope.newloan.type = 'debit';
        $scope.newloan.action = 'loan';
        $scope.newloan.ref = 'loan';
        $scope.newloan.user = angular.copy(v.req_by);
        $scope.newloan.amount = angular.copy(v.amount);
        $scope.newloan.notes = 'Loan Ref - '+k;
        if($scope.user.isAdmin){
          $scope.overview.balance = parseInt($scope.overview.balance) - parseInt(v.amount);
          firebase.database().ref('summary/balance').set($scope.overview.balance);
          
          $scope.newloan.balance = $scope.overview.balance;
          firebase.database().ref('transaction').push($scope.newloan);
          $.notify("Payment Submitted", "success");
        } else {
          $.notify("Invalid Entry", "error");
        }
        
        $state.go('statement');
        
        return false;
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
      $scope.loanrequest.loan_status = 0;
      firebase.database().ref('loanrequest').push($scope.loanrequest);
      $.notify("Your loan request submitted", "info");
      $state.go('overview');
      
      $scope.loanrequest = {amount: angular.copy($scope.eligilityAmount)};
      
      return false;
    };
    
    $scope.loanrequestExist = false;
    $scope.loanExist = false;
    
    $scope.checkloanExist = function(){
      
        $scope.loanrequestExist = false;
        $scope.loanExist = false;
        angular.forEach($scope.activeloans, function(v,k){
          if(v.req_by == $scope.user.id){
            $scope.loanExist = true;
          }
        });
        
        angular.forEach($scope.loanRequests, function(v,k){
          if(v.req_by == $scope.user.id){
            $scope.loanrequestExist = true;
          }
        });
    };
    
    $scope.myloan = {};
    
    $scope.loanDetails = function(){
      angular.forEach($scope.activeloans, function(v,k){
        if(v.req_by == $scope.user.id){
          $scope.myloan = angular.copy(v);
          $scope.myloan.id = k;
          $scope.myloan.principle = 0;
          $scope.myloan.totaldue = 0;
          if($scope.myloan.transaction){
              angular.forEach($scope.myloan.transaction, function(vv,kk) {
                $scope.myloan.totaldue++;
                vv.ind = $scope.myloan.totaldue;
              });
          }
        }
      });
    };

    $scope.loanDetails2 = function(){
      firebase.database().ref('loanrequest/'+$state.params.id).once('value', function(snap) {
        $scope.myloan = snap.val();
        $scope.myloan.id = $state.params.id;
          $scope.myloan.principle = 0;
          $scope.myloan.totaldue = 0;
          if($scope.myloan.transaction){
              angular.forEach($scope.myloan.transaction, function(vv,kk) {
                $scope.myloan.totaldue++;
                vv.ind = $scope.myloan.totaldue;
              });
          } else {
            $scope.myloan.outstanding = angular.copy($scope.myloan.amount);
            $scope.myloan.totalinterest = 0;
          }
      });
    };
    
    $scope.missed_payment = false;

    $scope.payloan = function(){
        $scope.myloan.outstanding = $scope.myloan.outstanding - $scope.myloan.principle;
        var loandt = {};
        loandt.interest = $scope.myloan.interest;
        loandt.principle = $scope.myloan.principle;
        loandt.outstanding = $scope.myloan.outstanding;
        loandt.interestrate = $scope.myloan.interestrate
        loandt.ts = new Date().getTime();
        
        if(loandt.outstanding == 0){
          firebase.database().ref('loanrequest'+'/'+$scope.myloan.id+'/loan_status').set(2);
        }
        firebase.database().ref('loanrequest'+'/'+$scope.myloan.id+'/lastpaid').set(loandt.ts);
        firebase.database().ref('loanrequest'+'/'+$scope.myloan.id+'/outstanding').set(loandt.outstanding);
        $scope.myloan.totalinterest = $scope.myloan.totalinterest ? (parseInt($scope.myloan.totalinterest) + parseInt(loandt.interest)) : loandt.interest;
        firebase.database().ref('loanrequest'+'/'+$scope.myloan.id+'/totalinterest').set($scope.myloan.totalinterest);
        firebase.database().ref('loanrequest'+'/'+$scope.myloan.id+'/transaction').push(loandt);
        
        var tamt = parseInt($scope.myloan.principle) + parseInt(loandt.interest);
        
        $scope.overview.balance = tamt + parseInt($scope.overview.balance);
        firebase.database().ref('summary/balance').set($scope.overview.balance);
        
        $scope.overview.interest = parseInt($scope.myloan.interest) + parseInt($scope.overview.interest);
        firebase.database().ref('summary/interest').set($scope.overview.interest);
        
        var payloan = {ref: $scope.myloan.id};
        payloan.ts = new Date().getTime();
        payloan.type = 'credit';
        payloan.action = 'payloan';
        payloan.user = $scope.myloan.req_by;
        payloan.amount = tamt;
        payloan.notes = 'Loan Ref - '+$scope.myloan.id+' Principle - '+$scope.myloan.principle + ' Interest - '+$scope.myloan.interest;
        payloan.balance = $scope.overview.balance;
        firebase.database().ref('transaction').push(payloan);

        $state.go('statement');
    };
    
    $scope.statement_calc = function(tr){
        if(tr.action == 'savings'){
          $scope.pageInfo.ovt.a = parseInt($scope.pageInfo.ovt.a) + parseInt(tr.amount);
          
        } else if(tr.action == 'loan'){
          $scope.pageInfo.ovt.c = parseInt($scope.pageInfo.ovt.c) + parseInt(tr.amount);
        } else if(tr.action == 'payloan'){
          var spi = tr.notes.split('Interest - ');
          if(spi.length == 2){
            var intt = spi[1];
            var princi = tr.amount - intt;
            
            $scope.pageInfo.ovt.b = parseInt($scope.pageInfo.ovt.b) + parseInt(intt);
            $scope.pageInfo.ovt.c = $scope.pageInfo.ovt.c - princi;
            
          }
        }

        tr.balancea = angular.copy($scope.pageInfo.ovt.a);
        tr.balanceb = angular.copy($scope.pageInfo.ovt.b);
        tr.balancec = angular.copy($scope.pageInfo.ovt.c);

    };

  });
