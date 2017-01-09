angular.module('FileUploadApp')
.service('CheckService',['$http', '$q', function ($http, $q) {
  var getDetails = function(input) {        
    var deferred = $q.defer();       
    // console.log("inside CheckService.getDetails(): input = " + JSON.stringify(input));
    var AgentFunctionURL = "https://docchain.stratumn.net/maps/" 
                          + input.mapId + "?tags=consent";
    // console.log("outside AgentFunctionURL = " + AgentFunctionURL);                              
    $http
      .get(
        AgentFunctionURL)
      .success(function(res){
        var DataLinkHash = res[0].meta.linkHash;
        AgentFunctionURL = "https://docchain.stratumn.net/links/" 
                          + DataLinkHash;
        // console.log("inside AgentFunctionURL = " + AgentFunctionURL);
        $http
          .get(
            AgentFunctionURL)
          .success(function(res){
            // console.log("inside getDetails Srvc - GET DATA res = " + JSON.stringify(res));
            AgentFunctionURL = "https://docchain.stratumn.net/branches/" 
                              + DataLinkHash + "?tags=signature";
            // console.log("inside CHECK AgentFunctionURL = " + AgentFunctionURL);
            $http
              .get(AgentFunctionURL)
              .success(function(resSigns){
                var resSignsLength = resSigns.length;
                var NumOfAcceptees = 0;
                for (var i = 0; i < resSignsLength; i++) {
                  // console.log("resSigns[i].link = " + JSON.stringify(resSigns[i].link));
                  if (resSigns[i].link.meta.tags[3] == 1)
                    NumOfAcceptees++;
                  var dt = new Date(resSigns[i].link.meta.tags[6]);
                  var strDateInFrench = dt.toLongFrenchFormat(); 
                  resSigns[i].link.meta.tags[6] = strDateInFrench;                  
                  // console.log("resSigns[i].link.meta.tags[6] = " + resSigns[i].link.meta.tags[6] 
                  //           + "\ndt = " + dt 
                  //           + "\nstrDateFrench = " + strDateInFrench);  
                  res.link.state.FormData.Invites[resSigns[i].link.meta.priority].tags = 
                                resSigns[i].link.meta.tags;
                }
                res.link.state.FormData.NumOfAcceptees = NumOfAcceptees;
                res.link.state.FormData.NumOfNoReplies = 
                            res.link.state.FormData.Invites.length - resSigns.length;
                res.link.state.FormData.LinkHash = DataLinkHash;
                res.link.state.FormData.DaysLeft = 2; res.link.state.FormData.Status = "Pending";
                // console.log("res.link.state.FormData = " + JSON.stringify(res.link.state.FormData));
                deferred.resolve(res.link.state.FormData); //Data);                                
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

    Date.prototype.toLongFrenchFormat = function () {
        var months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
        var date = this.getDate();
        if (date < 10) {
            date = "0" + date;  
        }
        var output = date + " " + months[this.getMonth()] 
                  + " " + this.getFullYear()
                  + " " + this.getHours() + "h" + this.getMinutes();
        // console.log("output = " + output);
        return output;
    };

    return {        
      getDetails: getDetails
    };

}]);

