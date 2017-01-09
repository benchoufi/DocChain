/**
 * Docchain App
 * @author Anuj
 */

/**
 * Main AngularJS Web Application
 */
var app = angular.module('FileUploadApp', [  
]);

/**
 * Enable cross domain calls
 */
app.config(['$httpProvider', '$locationProvider',
  function ($httpProvider, $locationProvider) {
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
    $locationProvider.html5Mode(true);
}]);

app.filter('reverse', function() {
  return function(items) {
  	if (items)
    	return items.slice().reverse();
  };
});