/**
 * Upload File to S3 App
 * @author Anuj
 */

/**
 * Controller 
 */
angular.module('FileUploadApp')
  .controller('FileUploadCtrl', ['$scope', '$document', '$http', 'fileUpload', '$window', 'CommonDataService', 
    function ($scope, $document, $http, fileUpload, $window, CommonDataService) {     
      $scope.isUploading = false;
      // console.log("isUploading = " + $scope.isUploading);
      $scope.SignedURLToView = false;
      $scope.myFile = {};
      $scope.$watch('uploadFile', function(){
        $scope.myFile = $scope.uploadFile;
        if (!!$scope.myFile) {
          // console.log("$scope.myFile = " + JSON.stringify($scope.myFile.name));
          $('#UploadBtn1').attr('class', 'col s12');
        }
      });

      $scope.upload = function () {
        var file = $scope.uploadFile;
        // console.log('inside upload')
        if(!!file){    
          $scope.isUploading = true;
          var NewFileName = (new Date()).getTime() + '-' + file.name;               
          fileUpload.getSignedURLToUpload(NewFileName, file.size, file.type, 'https://docchain.stratumn.net/maps')
            .then(function (res) {
              var linkHash = res.meta.linkHash;
              // $scope.isDisabled = true;
              fileUpload.uploadFileToSignedUrl(file, res.link.state.SignedURLToUpload)
                .then(function (res) {                  
                  // console.log("uploadFileToSignedUrl: res = " + JSON.stringify(res));
                  fileUpload.getSignedURLToView('https://docchain.stratumn.net/links/' + linkHash + '/getSignedUrlToView', NewFileName)
                    .then(function(res){
                      res = res.link.state.SignedURLToView;
                      console.log("return from getSignedURLToView = " + JSON.stringify(res));
                      $scope.SignedURLToView = res;
                      // console.log('Done : file = ' + JSON.stringify(file.name));
                      $scope.isUploading = false;
                      $('#UploadFile1').attr('class', 'hide row');
                      $('#EmailInvites').attr('class', 'row');
                      $('#filename').val('');
                      $("html, body").animate({
                        scrollTop: $(document).height()
                      }, 9000); 
                      $('#doc_title').focus();
                      Materialize.toast('Telechargement terminé ' + file.name, 4000, 'blue');                  
                    }, function(err) {
                      console.log("err = " + JSON.stringify(err)); //$window.location.href = "/oops.html";
                    });                                      
                }, function(err) {
                  console.log("err = " + JSON.stringify(err)); //$window.location.href = "/oops.html";
                });                                          
            }, function(err) {
              console.log("err = " + JSON.stringify(err)); //$window.location.href = "/oops.html";
            });                          
          }
          else {
            // Materialize.toast($scope.screentext.UPLDUSRIMG_2, 4000);
          }
      };

      $scope.uploadVersion = function () {
        // console.log("inside uploadVersion");
        var LinkHash = CommonDataService.getLatestVersionByLinkHash();
        // console.log("getLatestVersionByLinkHash = " + LinkHash); 
        var file = $scope.uploadFile;
        // console.log('inside upload')
        if(!!file){    
          $scope.isUploading = true;
          var NewFileName = (new Date()).getTime() + '-' + file.name;                         
          // console.log("NewFileName = " + NewFileName 
          //   + "; file.size = " + file.size + "; file.type = " + file.type);
          fileUpload.getSignedURLToUpload(NewFileName, file.size, file.type, 
              'https://docchain.stratumn.net/links/' + LinkHash + '/getSignedUrlToUpload')
            .then(function (res) {
              // console.log('getSignedURLToUpload: res = ' + JSON.stringify(res));
              var linkHash = res.meta.linkHash;
              // $scope.isDisabled = true;
              fileUpload.uploadFileToSignedUrl(file, res.link.state.SignedURLToUpload)
                .then(function (res) {                  
                  // console.log("getSignedUrlToView = https://docchain.stratumn.net/links/"+ linkHash + "/getSignedUrlToView");
                  $scope.isUploading = false;
                  $('#UploadFile1').attr('class', 'hide row');
                  $('#EmailInvites').attr('class', 'row');
                  $('#filename').val('');
                  // $('#loadState').click();
                  $('#doc_title').focus();
                  Materialize.toast('Telechargement terminé ' + file.name, 4000, 'blue');                                   
                }, function(err) {                  
                  console.log("uploadFileToSignedUrl: err = " + JSON.stringify(err));
                  $window.location.href = "/oops.html";
                });  

            }, function(err) {
              console.log("getSignedURLToUpload: err = " + JSON.stringify(err));
              $window.location.href = "/oops.html";
            });                          
          }
          else {
            // Materialize.toast($scope.screentext.UPLDUSRIMG_2, 4000);
          }
      };

      $scope.cancel = function(){
        if(!!$scope.uploadFile){ //console.log('about to cancel');          
          $scope.uploadFile = {};
          $('#UploadBtn1').attr('class', 'hide col s12');
        }
      }
  }]); // end of controller
