angular.module('FileUploadApp')
.service('CommonDataService',['$http', '$q', function ($http, $q) { 
    var FileName, LinkHash, state, LatestVersionByLinkHash;

    var setFileName = function(InputFileName) {
        if (!!InputFileName) 
            FileName = InputFileName;
    }

    var setLinkHash = function(InputLinkHash) {
        if (!!InputLinkHash) 
            LinkHash = InputLinkHash;
    }

    var getFileName = function() {
        if (!!FileName) 
            return FileName;
    }

    var getLinkHash = function() {
        if (!!LinkHash) 
            return LinkHash;
    }

    var setState = function(inputState) { 
        if (!!inputState) 
            state = inputState;
    }

    var getState = function() {
        if (!!state) 
            return state;
    }

    var setLatestVersionByLinkHash = function(inputLatestVersionByLinkHash) {
        if (!!inputLatestVersionByLinkHash)
            LatestVersionByLinkHash = inputLatestVersionByLinkHash;
    }

    var getLatestVersionByLinkHash = function() {
        if (!!LatestVersionByLinkHash)
            return LatestVersionByLinkHash;
    }

    return {
        setFileName: setFileName,
        setLinkHash: setLinkHash,
        getFileName: getFileName,
        getLinkHash: getLinkHash,
        getState: getState,
        setState: setState,
        setLatestVersionByLinkHash: setLatestVersionByLinkHash,
        getLatestVersionByLinkHash: getLatestVersionByLinkHash
    };

}]);

