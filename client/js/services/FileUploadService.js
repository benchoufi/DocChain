Date.prototype.toLongFrenchFormat = function () {
    var months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
    var date = this.getDate();
    if (date < 10) {
        date = "0" + date;  
    }
    var output = date + " " + months[this.getMonth()] + " " + this.getFullYear();
    return output;
};
var d = new Date();
var strDateInFrench = d.toLongFrenchFormat(); 
$('#Today').text('Aujourd\'hui est ' + strDateInFrench);

angular.module('FileUploadApp')
.service('fileUpload',['$http', '$q', function ($http, $q) { 
    var FileName, LinkHash;
    var getSignedURLToUpload = function(NewFileName, FileSize, FileType, AgentUrl){
        FileName = NewFileName;
        var deferred = $q.defer();        
        $http
            .post(
                AgentUrl, 
                JSON.stringify({"name": NewFileName, "size": FileSize, "type": FileType}))
            .success(function(data){
                LinkHash = data.meta.linkHash;
                deferred.resolve(data);
            })
            .error(function(err){
                Materialize.toast(err, 4000, 'blue')
                console.log("err = " + JSON.stringify(err));
                deferred.reject(err);
        });
        return deferred.promise;
    };

    var uploadFileToSignedUrl = function(file, UploadURL){
        var deferred = $q.defer();
        var fd = new FormData();
        fd.append('file', file);
        $http
            .put(
              UploadURL, //res.link.state.SignedURLToUpload,
              fd, {       
                transformRequest: angular.identity,
                headers: {'Content-Type': file.type}                             
            })
            .success(function(data){
              deferred.resolve(data);
            })
            .error(function(err){
              Materialize.toast(err.text, 4000, 'blue')
              deferred.reject(err);
            });

        return deferred.promise;
    }

    var getSignedURLToView = function(AgentFunctionURL, NewFileName) { 
        var deferred = $q.defer();
        NewFileName = NewFileName || FileName; 

        $http
            .post(
                AgentFunctionURL, 
                JSON.stringify(NewFileName))
            .success(function(data){
                // console.log(AgentFunctionURL + "\n" + NewFileName + "\n" + JSON.stringify(data));
                deferred.resolve(data);                
            })
            .error(function(err){
                Materialize.toast(err, 4000, 'blue')
                deferred.reject(err);
          });
        return deferred.promise;
    };

    var setFileName = function(NewFileName) {
        FileName = NewFileName;
    };

    var getFileName = function() {
        if (!!FileName) 
            return FileName;
    }

    var getLinkHash = function() {
        if (!!LinkHash) 
            return LinkHash;
    }

    return {
        setFileName: setFileName,
        getFileName: getFileName,
        getLinkHash: getLinkHash,
        getSignedURLToUpload: getSignedURLToUpload,
        uploadFileToSignedUrl: uploadFileToSignedUrl,
        getSignedURLToView: getSignedURLToView
    };

}]);
