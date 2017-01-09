angular.module('FileUploadApp')
.service('EmailService',['$http', '$q', function ($http, $q) {
    var SendEmail = function(AgentFunctionURL, data) {
        console.log("inside SendEmail Srvc - AgentFunctionURL = " + AgentFunctionURL);
        var deferred = $q.defer();        
        $http
            .post(
                AgentFunctionURL, //'https://docchain.stratumn.net/links/:hash/sendEmail', 
                JSON.stringify(data))
            .success(function(data){
                // Materialize.toast(data.link.state.SignedURLToView, 4000, 'blue')
                // console.log("inside SendEmail Srvc - res = " + JSON.stringify(data));
                deferred.resolve(data);                
            })
            .error(function(err){
                Materialize.toast(err, 4000, 'blue')
                deferred.reject(err);
          });
        return deferred.promise;
    };

    return {        
        SendEmail: SendEmail
    };

}]);

