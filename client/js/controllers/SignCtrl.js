angular.module('FileUploadApp')
.controller('SignCtrl', ['$scope', '$document', '$http', 'fileUpload', '$location', '$routeParams', '$window', 'SignService',
  function ($scope, $document, $http, fileUpload, $location, $routeParams, $window, SignService) {
    var ExpiresOn = 14, MaxNumOfPatients = 1;
    $scope.isLoading = false;
    $scope.LinkHash = ''; $scope.Document_ID = ''; $scope.Address = '';
    $scope.location = $location;
    var chk1IconRowInnerHTML, chk2IconRowInnerHTML;
    $scope.$watch('location.search()', function() {
        $scope.Document_ID = ($location.search()).docid;
        $scope.WIF = ($location.search()).address;
        $scope.LinkHash = ($location.search()).linkhash;
        getDetails();
    }, true);
// ButtonSign
    $scope.$watch('chk1Btn', function() {
      if (!!$scope.chk1Btn) {
        chk1IconRowInnerHTML = $('#chk1IconRow').html();
        chk2IconRowInnerHTML = $('#chk2IconRow').html();
        $('#chk1IconRow').html(chk2IconRowInnerHTML)
        $('#chk2IconRow').html(chk1IconRowInnerHTML);
        $('#chk2Label').attr('class', 'bold yellow-text');
        $('#chk1Label').attr('class', '');
        $('#chk1Btn').prop('disabled', true);
        $('#chk2Btn').prop('disabled', false);
      }
      else {
        $('#chk2Label').attr('class', '');
      }
    }, true);
    $scope.$watch('chk2Btn', function() {
      if (!!$scope.chk2Btn) {
        $('#ButtonSignIcon').html($('#chk2IconRow').html());
        chk2IconRowInnerHTML = $('#chk2IconRow').html();
        $('#chk2IconRow').html('&nbsp');
        $('#chk2Btn').prop('disabled', true);
        $('#ButtonSignFiller').attr('class', 'hide col s11');
        $('#ButtonSign').attr('class', 'col s11');
        $('#chk2Label').attr('class', '');
      }
      else {
        $('#chk2Label').attr('class', '');
      }
    }, true);

    var getDetails = function() {
      $scope.isLoading = true;
      SignService.getDetails({Document_ID: $scope.Document_ID, WIF: $scope.WIF, LinkHash: $scope.LinkHash})
      .then(function(data) {
        var AgentFunctionURL = 'https://docchain.stratumn.net/links/' + data.DataLinkHash + '/getSignedUrlToView';
        fileUpload.getSignedURLToView(AgentFunctionURL)
          .then(function(res){
            res = res.link.state.SignedURLToView;
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
            $scope.AlreadySigned = SignService.getAlreadySigned();
            $scope.SignedURLToView = res;
            $scope.isLoading = false;
          }, function(err) {
            $scope.isLoading = false;
            console.log("err = " + JSON.stringify(err));
          });
      }, function (err) {
        console.log("getDetails return: err = " + JSON.stringify(err));

        // forward to Error Page
        $scope.isLoading = false;
        $window.location.href = "/oops.html";
      });
    }

    $scope.Save = function(AcceptOrRefuse){
      // Document_ID, "signature", Name, Email, AcceptOrRefuse, Signature
      var Data = {
        DateSigned: new Date(),
        WIF: $scope.WIF,
        Signature: $scope.data.Signature,
        Consent: AcceptOrRefuse
      };

      $scope.isLoading = true;
      SignService.sign(Data)
      .then(function(data) {
        $scope.AlreadySigned = AcceptOrRefuse;
        $scope.isLoading = false;
      }, function(err) {
        console.log("Save: err = " + JSON.stringify(err));
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
