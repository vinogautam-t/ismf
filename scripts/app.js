'use strict';

/**
 * @ngdoc overview
 * @name yapp
 * @description
 * # yapp
 *
 * Main module of the application.
 */
var states = [
        { name: 'base', state: { abstract: true, url: '', templateUrl: 'views/base.html', data: {text: "Base", visible: false } } },
        { name: 'login', state: { url: '/login', parent: 'base', templateUrl: 'views/login.html', controller: 'LoginCtrl', data: {text: "Login", visible: false } } },
        { name: 'dashboard', state: { url: '/dashboard', parent: 'base', templateUrl: 'views/dashboard.html', controller: 'DashboardCtrl', data: {text: "Dashboard", visible: false } } },
        { name: 'overview', state: { url: '/overview', parent: 'dashboard', templateUrl: 'views/dashboard/overview.html', data: {text: "Overview", visible: true } } },
        { name: 'statement', state: { url: '/statement', parent: 'dashboard', templateUrl: 'views/dashboard/statement.html', data: {text: "Statement", visible: true } } },
        { name: 'paysavings', state: { url: '/paysavings', parent: 'dashboard', templateUrl: 'views/dashboard/paysavings.html', data: {text: "Pay Savings", visible: true } } },
        { name: 'payloan', state: { url: '/payloan', parent: 'dashboard', templateUrl: 'views/dashboard/payloan.html', data: {text: "My Loan", visible: true } } },
        { name: 'viewloan', state: { url: '/viewloan/:id', parent: 'dashboard', templateUrl: 'views/dashboard/viewloan.html', data: {text: "View Loan", visible: false} } },
        { name: 'loanrequest', state: { url: '/loanrequest', parent: 'dashboard', templateUrl: 'views/dashboard/loanrequest.html', data: {text: "New Loan Request", visible: true } } },
        { name: 'logout', state: { url: '/login', data: {text: "Logout", visible: false }} }
    ];
   
angular.module('yapp', [
                'ui.router',
                'snap',
                'ngAnimate'
            ])
        .config(function($stateProvider, $urlRouterProvider) {
            $urlRouterProvider.when('/dashboard', '/dashboard/overview');
            $urlRouterProvider.otherwise('/login');
            
            angular.forEach(states, function (state) {
                $stateProvider.state(state.name, state.state);
            });
        })


.factory('AuthService', function ($http, Session) {
    var authService = {};
             
    authService.login = function (credentials) {
    return $http
        .post('http://net-managers.in/expense_tracker/api.php?action=auth', credentials)
        .then(function (res) {
            return res;
        });
    };

    authService.add_expense = function (expense) {
    return $http
        .post('http://net-managers.in/expense_tracker/api.php?action=add_expense', expense)
        .then(function (res) {
            return res;
        });
    };

    authService.overview = function (credentials) {
    return $http
        .get('http://net-managers.in/expense_tracker/api.php?action=overview&id='+Session.userId, credentials)
        .then(function (res) {
            return res;
        });
    };

    authService.users = function (credentials) {
    return $http
        .get('http://net-managers.in/expense_tracker/api.php?action=users')
        .then(function (res) {
            return res;
        });
    };
             
    authService.isAuthenticated = function () {
        return !!Session.userId;
    };
             
    return authService;
})
.factory('Cookies', function ($http) {
    var cookies = {};
             
    cookies.put = function (cname, cvalue) {
        var d = new Date();
        d.setTime(d.getTime() + (365*24*60*60*1000));
        var expires = "expires="+d.toUTCString();
        document.cookie = cname + "=" + cvalue + "; " + expires;
    };
             
    cookies.get = function (cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for(var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    };
             
    return cookies;
})
.service('Session', function (Cookies) {
    this.create = function (user, save) {
        this.userId = user.id;
        this.user = user;
        if(save)
        Cookies.put("auth", JSON.stringify(user));
    };
    this.destroy = function () {
        this.userId = null;
        this.user = null;
        Cookies.put("auth", "");
    };
})
.constant('AUTH_REDIRECT', {
    loginredirect: '/dashboard/',
    logoutredirect: '/'
})
.run(function($rootScope, $location, AuthService, Session, AUTH_REDIRECT, Cookies) {
    if(!!Cookies.get("auth"))
        Session.create(JSON.parse(Cookies.get("auth")), false);
});
