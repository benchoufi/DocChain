angular.module('FileUploadApp')
.service('SignService',['$http', '$q', 'fileUpload', function ($http, $q, fileUpload) {
    var DataLinkHash, AlreadySigned = -1;
    var getDetails = function(input) {        
        var deferred = $q.defer();       
        var AgentFunctionURL = "https://docchain.stratumn.net/branches/" + input.LinkHash + "?tags=consent";
        var AgentFunctionURL = AgentFunctionURL;
        $http
            .get(
                AgentFunctionURL)
            .success(function(res){                
                if (!res.length) {
                    deferred.reject("Incorrect LinkHash");            
                }
                else {
                    var FileName = res[0].link.meta.tags[0];
                    fileUpload.setFileName(FileName);
                    DataLinkHash = res[0].meta.linkHash;
                    AgentFunctionURL = "https://docchain.stratumn.net/links/" + DataLinkHash + "/getConsentForSigning";
                    $http
                        .post(
                            AgentFunctionURL,
                            JSON.stringify(input.WIF))
                        .success(function(res){
                            if (res.meta.errorMessage) {
                                deferred.reject(res.meta.errorMessage);            
                            }
                            else {
                                var AgentFunctionURL = "https://docchain.stratumn.net/branches/" 
                                                    + DataLinkHash + "?tags=signature"; 
                                $http.get(AgentFunctionURL)
                                    .success(function(resSigns){
                                        var resSignsLength = resSigns.length;
                                        var NumOfAcceptees = 0;
                                        for (var i = 0; i < resSignsLength; i++) {                                 
                                          if (resSigns[i].link.meta.tags[3] == 1)
                                            NumOfAcceptees++;
                                          if (resSigns[i].link.meta.tags[2] == res.link.state.FormData.Detail.Email) {
                                            AlreadySigned = resSigns[i].link.meta.tags[3];
                                            res.link.state.FormData.Signature = resSigns[i].link.meta.tags[4];                                            
                                          }
                                        }
                                        res.link.state.FormData.NumOfAcceptees = NumOfAcceptees;
                                        res.link.state.FormData.NumOfNoReplies = 
                                                res.link.state.FormData.Invites.length - resSigns.length;                                        
                                        res.link.state.FormData.DataLinkHash = DataLinkHash;                                                
                                        AgentFunctionURL = "https://docchain.stratumn.net/branches/" 
                                                    + DataLinkHash + "?tags=canceled";  
                                        $http.get(AgentFunctionURL)
                                            .success(function(resCanceled){
                                                res.link.state.FormData.Canceled = resCanceled.length;
                                                deferred.resolve(res.link.state.FormData); //Data); 
                                            })
                                            .error(function(err){
                                                deferred.reject(err);            
                                            });
                                    })
                                    .error(function(err){
                                        deferred.reject(err);            
                                    });                                                            
                            }
                                           
                        })
                        .error(function(err){
                            deferred.reject(err);            
                        });
                    
                }
            })
            .error(function(err){
                deferred.reject(err);            
            });

        return deferred.promise;
    };

    var sign = function(data) {
        var deferred = $q.defer();       
        var AgentMethodURL = "https://docchain.stratumn.net/links/" + DataLinkHash 
                          + "/saveSignature";        
        $http
            .post(
                AgentMethodURL,
                JSON.stringify(data))
            .success(function(res){
                AlreadySigned = data.AcceptOrRefuse;
                deferred.resolve(res);
            })
            .error(function(err){
                // Materialize.toast(err, 4000, 'blue')
                deferred.reject(err);            
            });
        return deferred.promise;            
    };

    var getAlreadySigned = function() {
        return AlreadySigned;
    };

    return {        
        getDetails: getDetails,
        sign: sign,
        getAlreadySigned: getAlreadySigned
    };

}]);

