angular.module('FileUploadApp')
.controller('VersionCtrl', ['$scope', '$document', '$http', 'fileUpload', '$location', '$routeParams', '$window', 'VersionService', 'CommonDataService',
  function ($scope, $document, $http, fileUpload, $location, $routeParams, $window, VersionService, CommonDataService) {
    var ExpiresOn = 14, MaxNumOfPatients = 1;
    $scope.isLoading = false;
    $scope.Document_ID = ''; $scope.Address = '';
    $scope.location = $location;
    $scope.$watch('location.search()', function() {
        $scope.mapId = ($location.search()).mapId;
        if (!!$scope.mapId) {
          getVersions($location.search());
        }
    }, true);

    $scope.initModals = function() {
        $('.mt').leanModal({
          dismissible: true, // Modal can be dismissed by clicking outside of the modal
          opacity: .5, // Opacity of modal background
          in_duration: 300, // Transition in duration
          out_duration: 200, // Transition out duration
          ready: function() { // Callback for Modal open
          },
          complete: function() { // Callback for Modal close
          }
        }); // Initialize the modals
    }

    var getVersions = function(input) {
      VersionService.getVersions(input)
      .then(function(versions) {
        $scope.versions = versions;
        var LatestVersionByLinkHash = versions[versions.length - 1].meta.linkHash;
        CommonDataService.setLatestVersionByLinkHash(LatestVersionByLinkHash);
        $scope.getVersionDetails(LatestVersionByLinkHash);
      }, function(err) {
        console.log("err = " + JSON.stringify(err));
      });
    };

    $scope.getVersionDetails = function(LinkHash) {
      $scope.isLoading = true;
      CommonDataService.setLinkHash(LinkHash);
      $scope.SelectedLinkHash = LinkHash;
      VersionService.getVersionDetails(LinkHash)
        .then(function(data){
        var ConsentFormSentOn = new Date(data.Today);
        ExpiresOn = data.ExpiresIn; MaxNumOfPatients = parseInt(data.Max_Patients);
        data.DaysLeft = getDateDiffFromToday(ConsentFormSentOn, ExpiresOn);
        data.Expired = false;
        if (data.DaysLeft < 1 ||
          (data.NumOfAcceptees >= MaxNumOfPatients  && MaxNumOfPatients > 1) || //
            ((data.NumOfAcceptees + data.NumOfNoReplies) < MaxNumOfPatients && MaxNumOfPatients > 1) || //Not enough places left
            data.NumOfAcceptees == data.Invites.length) {
          data.Expired = true;
          data.Status = "Expired";
        }
        $scope.data = data;
        $scope.SignedURLToView = data.SignedURLToView;
        $scope.isLoading = false;
      }, function(err) {
        $scope.isLoading = false;
        console.log("err = " + JSON.stringify(err));
        $window.location.href = "/oops.html";
      });

    }

    $scope.getDateInFrench = function(input) {
      var months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
      var InputDate = new Date(input);
      var date = InputDate.getDate();
      if (date < 10) {
          date = "0" + date;
      }
      var output = date + " " + months[InputDate.getMonth()]
                + " " + InputDate.getFullYear()
                + " " + InputDate.getHours() + "h" + InputDate.getMinutes();
      return output;
    }

    var getDateDiffFromToday = function(StartDate, MaxNumOfDays) {
      var EndDate = new Date(StartDate.getTime() + MaxNumOfDays*24*60*60*1000);
      var Today = new Date();
      var timeDiff = Math.abs(Today.getTime() - EndDate.getTime());
      var Diff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      return Diff;
    }

    $scope.cancel = function(LinkHash) {
      VersionService.cancel(LinkHash)
        .then(function(data){
          $scope.data.Canceled = 1;
      }, function(err) {
        $scope.isLoading = false;
      });
    };
}]); // end of controller
