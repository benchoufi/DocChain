angular.module('FileUploadApp')
.service('VersionService',['$http', '$q', 'fileUpload', 'CommonDataService', 
  function ($http, $q, fileUpload, CommonDataService) {
  var getVersions = function(input) {        
    var deferred = $q.defer();       
    var AgentFunctionURL = "https://docchain.stratumn.net/maps/" 
                          + input.mapId + "?tags=consent";
    $http
      .get(
        AgentFunctionURL)
      .success(function(res){
        var FileName = res[0].link.meta.tags[0];
        fileUpload.setFileName(FileName);
        var DataLinkHash = res[0].meta.linkHash;
        AgentFunctionURL = "https://docchain.stratumn.net/links/" 
                          + DataLinkHash;
        deferred.resolve(res);                               
      })
      .error(function(err){
        deferred.reject(err);            
      });

      return deferred.promise;
  };

  var getVersionDetails = function(LinkHash) { 
    var deferred = $q.defer();           
    AgentFunctionURL = 'https://docchain.stratumn.net/links/' + LinkHash + '/getSignedUrlToView';
    fileUpload.getSignedURLToView(AgentFunctionURL)
      .then(function(res){ 
        if (LinkHash == CommonDataService.getLatestVersionByLinkHash())       
          CommonDataService.setState(res.link.state); 
        AgentFunctionURL = "https://docchain.stratumn.net/branches/" 
                          + LinkHash + "?tags=signature";
        $http
          .get(AgentFunctionURL)
          .success(function(resSigns){
            var resSignsLength = resSigns.length;
            var NumOfAcceptees = 0;
            for (var i = 0; i < resSignsLength; i++) {
              if (resSigns[i].link.meta.tags[3] == 1)
                NumOfAcceptees++;
              var dt = new Date(resSigns[i].link.meta.tags[6]);
              var strDateInFrench = dt.toLongFrenchFormat(); 
              resSigns[i].link.meta.tags[6] = strDateInFrench;                  
              res.link.state.FormData.Invites[resSigns[i].link.meta.priority].tags = 
                            resSigns[i].link.meta.tags;
              res.link.state.FormData.Invites[resSigns[i].link.meta.priority].linkHash 
                            = resSigns[i].meta.linkHash;                                
            }
            res.link.state.FormData.NumOfAcceptees = NumOfAcceptees;
            res.link.state.FormData.NumOfNoReplies = 
                        res.link.state.FormData.Invites.length - resSigns.length;
            res.link.state.FormData.LinkHash = LinkHash;
            res.link.state.FormData.DaysLeft = 2; res.link.state.FormData.Status = "Pending";
            res.link.state.FormData.SignedURLToView = res.link.state.SignedURLToView;
            var AgentFunctionURL = "https://docchain.stratumn.net/branches/" 
                                  + LinkHash + "?tags=canceled";                                
            $http
              .get(AgentFunctionURL)
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

      }, function(err) {
        deferred.reject(err);            
      }); 
                              
    return deferred.promise;
  };

  var getDetails = function(input) {        
    var deferred = $q.defer();           
    var AgentFunctionURL = "https://docchain.stratumn.net/maps/" 
                          + input.mapId + "?tags=consent";
    $http
      .get(
        AgentFunctionURL)
      .success(function(res){
        var DataLinkHash = res[0].meta.linkHash;
        AgentFunctionURL = "https://docchain.stratumn.net/links/" 
                          + DataLinkHash;
        $http
          .get(
            AgentFunctionURL)
          .success(function(res){
            AgentFunctionURL = "https://docchain.stratumn.net/branches/" 
                              + DataLinkHash + "?tags=signature";            
            $http
              .get(AgentFunctionURL)
              .success(function(resSigns){
                var resSignsLength = resSigns.length;
                var NumOfAcceptees = 0;
                for (var i = 0; i < resSignsLength; i++) {                  
                  if (resSigns[i].link.meta.tags[3] == 1)
                    NumOfAcceptees++;
                  var dt = new Date(resSigns[i].link.meta.tags[6]);
                  var strDateInFrench = dt.toLongFrenchFormat(); 
                  resSigns[i].link.meta.tags[6] = strDateInFrench;    
                  res.link.state.FormData.Invites[resSigns[i].link.meta.priority].tags = 
                                resSigns[i].link.meta.tags;                  
                }
                res.link.state.FormData.NumOfAcceptees = NumOfAcceptees;
                res.link.state.FormData.NumOfNoReplies = 
                            res.link.state.FormData.Invites.length - resSigns.length;
                res.link.state.FormData.LinkHash = DataLinkHash;
                res.link.state.FormData.DaysLeft = 2; res.link.state.FormData.Status = "Pending";
                deferred.resolve(res.link.state.FormData);   
              })
              .error(function(err){
                deferred.reject(err);            
              });
          })
          .error(function(err){
            deferred.reject(err);            
          });
        })
        .error(function(err){
          deferred.reject(err);            
        });

      return deferred.promise;
  };

  var cancel = function (LinkHash) {
    var deferred = $q.defer();       
    var AgentFunctionURL = "https://docchain.stratumn.net/links/" 
                          + LinkHash + "/cancel";                          
    var deferred = $q.defer();        
    $http
        .post(AgentFunctionURL, "\"\"")
        .success(function(data){ 
            console.log("data cancel = " + JSON.stringify(data));
            deferred.resolve(data);//.link.state.SignedURLToUpload);                
        })
        .error(function(err){
            Materialize.toast(err, 4000, 'blue')
            console.log("err = " + JSON.stringify(err));
            deferred.reject(err);
      });
    return deferred.promise;
  };

  Date.prototype.toLongFrenchFormat = function () {
      var months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
      var date = this.getDate();
      if (date < 10) {
          date = "0" + date;  
      }
      var output = date + " " + months[this.getMonth()] 
                + " " + this.getFullYear()
                + " " + this.getHours() + "h" + this.getMinutes();
      return output;
  };

  return {        
    getVersions: getVersions,
    getDetails: getDetails,
    getVersionDetails: getVersionDetails,
    cancel: cancel
  };

}]);
