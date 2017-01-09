angular.module('FileUploadApp')
.controller('CheckCtrl', ['$scope', '$document', '$http', 'fileUpload', '$location', '$routeParams', '$window', 'CheckService', '$window',
  function ($scope, $document, $http, fileUpload, $location, $routeParams, $window, CheckService, $window) {
    var ExpiresOn = 14, MaxNumOfPatients = 1;
    $scope.isLoading = false;
    $scope.Document_ID = ''; $scope.Address = '';
    $scope.location = $location;
    // console.log('inside CheckCtrl');
    $scope.$watch('location.search()', function() {
        $scope.mapId = ($location.search()).mapId;
        // console.log("$scope.mapId = " + $scope.mapId);
        if (!!$scope.mapId) {
          // console.log('about to call getDetails: $location.search() = ' + JSON.stringify($location.search()));
          getDetails($location.search());
        }
    }, true);

    var getDetails = function(input) {
      $scope.isLoading = true;
      CheckService.getDetails(input)
      .then(function(data) {
        fileUpload.getSignedURLToView('https://docchain.stratumn.net/links/' + data.LinkHash + '/getSignedUrlToView')
          .then(function(res){
            res = res.link.state.SignedURLToView;
            var ConsentFormSentOn = new Date(data.Today);
            ExpiresOn = data.ExpiresIn; MaxNumOfPatients = parseInt(data.Max_Patients);
            data.DaysLeft = getDateDiffFromToday(ConsentFormSentOn, ExpiresOn);
            // console.log("data.DaysLeft = " + data.DaysLeft);
            // console.log("data.NumOfAcceptees = " + data.NumOfAcceptees);
            // console.log("ExpiresOn = " + ExpiresOn);
            // console.log("MaxNumOfPatients = " + MaxNumOfPatients);
            // console.log("data.NumOfNoReplies = " + data.NumOfNoReplies);
            // console.log("data.Invites.length = " + data.Invites.length);
            data.Expired = false;
            if (data.DaysLeft < 1 ||
              (data.NumOfAcceptees >= MaxNumOfPatients && MaxNumOfPatients > 1 ) || //
                ((data.NumOfAcceptees + data.NumOfNoReplies) < MaxNumOfPatients && MaxNumOfPatients > 1) || //Not enough places left
                data.NumOfAcceptees == data.Invites.length) {
              data.Expired = true;
              data.Status = "Expired";
            }
            // console.log("data = " + JSON.stringify(data));
            $scope.data = data;
            // console.log("SignCtrl: return from getSignedURLToView = " + JSON.stringify(res));
            $scope.SignedURLToView = res;
            $scope.isLoading = false;
          }, function(err) {
            $scope.isLoading = false;
            $window.location.href = "/oops.html";
          });
      }, function(err) {
        // forward to Error Page
        $scope.isLoading = false;
        $window.location.href = "/oops.html";
      });
    }

    var getDateDiffFromToday = function(StartDate, MaxNumOfDays) {
      var EndDate = new Date(StartDate.getTime() + MaxNumOfDays*24*60*60*1000);
      var Today = new Date();
      var timeDiff = Math.abs(Today.getTime() - EndDate.getTime());
      var Diff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      return Diff;
    }

}]); // end of controller
