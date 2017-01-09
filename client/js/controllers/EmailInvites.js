/**
 * Upload File to S3 App
 * @author Anuj
 */

/**
 * Controller 
 */
angular.module('FileUploadApp')
  .controller('EmailInvites', ['$scope', '$document', 'fileUpload', 'EmailService', '$window', 'CommonDataService',
    function ($scope, $document, fileUpload, EmailService, $window, CommonDataService) {     
      var state;
      $scope.max_patients = "";         
      $scope.expires_in = "";
      $scope.Invites = "";        //$scope.pdf_title = "QWE";

      $scope.loadState = function() { 
        // console.log('inside EmailInvites');
        state = CommonDataService.getState();
        if (state) { //console.log("state = " + JSON.stringify(state));
            $scope.max_patients = state.FormData.Max_Patients;         
            $scope.expires_in = state.FormData.ExpiresIn;
            $scope.Invites = state.FormData.Invites;  
            $scope.pdf_title = state.FormData.PDF_Title;
            $scope.cond = state.FormData.Conditions;
            // $scope.Invites = state.FormData.Doctor_Name;        
            // $scope.$apply();
        };        
      }

  	  Array.prototype.filterObjects = function(key, value) {
  		return this.filter(function(x) { return x[key] === value; })
  	  } 
  	  Array.prototype.indexOfObjects = function(key, value) {
  		return this.map(function(x) { return x[key]}).indexOf(value);
  	  }

      $scope.Invites = []; $scope.inputCounter = 0;     
      $scope.isEmailing = false; //for Preloader/Spinner      

      $scope.AddInvites = function() { 
      	if (!$scope.InviteEmail || !$scope.InviteEmail.length) {
      		$scope.InviteName = ''; $scope.InviteEmail = '';
      		return;      	      	
      	}      		      		
      	if ($scope.Invites.filterObjects("Email", $scope.InviteEmail).length) {
			    $scope.InviteName = ''; $scope.InviteEmail = '';
      		return;      	      	      		
      	}      		
      	if (!$scope.InviteName || !$scope.InviteName.length)       		
      		$scope.InviteName = $scope.InviteEmail;      	      	
      	$scope.Invites.push({Email: $scope.InviteEmail, Name: $scope.InviteName});
      	console.log("Invites = " + JSON.stringify($scope.Invites));      	
      	$scope.InviteName = ''; $scope.InviteEmail = '';
      	$('#InviteEmail').focus();
      }

      $scope.RemoveInvites = function(Email) { // console.log('inside Remove Invites');
      	$scope.Invites.splice($scope.Invites.indexOfObjects("Email", Email), 1);
      }

      $scope.SendEmail = function() {  
        // console.log('$scope.InviteEmail.length = ' + $scope.InviteEmail.length);
        // console.log('$scope.Invites.length = ' + $scope.Invites.length);
        if ($scope.max_patients > $scope.Invites.length) {
          Materialize.toast("Le nombre maximum d'insciptions doit être inférieur au nombre d'invités (" + $scope.Invites.length + ")", 7000, 'blue');
          return;
        }
        if ($scope.InviteEmail.length) {
          Materialize.toast('Vous n\'avez pas enregistré de participant. Merci de cliquer sur le bouton Plus sur la droite pour sauver l\'e-mail', 7000, 'blue');                  
          return;
        }              
        var data = {
          Document_ID: fileUpload.getFileName(),
          Doctor_Name: $scope.doc_name,
          Doctor_Email: $scope.doc_email,
          PDF_Title: $scope.pdf_title,
          Conditions: $scope.cond,
          ExpiresIn: $scope.expires_in,
          Max_Patients: $scope.max_patients,
          Invites: angular.toJson($scope.Invites),
          Today: new Date(),
          Version: 0
        };             
        var LinkHash = fileUpload.getLinkHash();
        if (!LinkHash) {
          Materialize.toast("Merci d'envoyer le fichier", 4000, 'blue');                  
          return;          
        }
        $scope.isEmailing = true;
        EmailService
          .SendEmail("https://docchain.stratumn.net/links/" + LinkHash + "/sendEmail", data)
          .then(function(data) {            
            // console.log("data = " + JSON.stringify(data))
            $window.location.href = "/version.html?mapId=" 
                                  + data.link.meta.mapId;
          }, function (err) {        
            // forward to Error Page
            console.log("err = " + JSON.stringify(err)); //$window.location.href = "/oops.html";
          });
      }

      $scope.SendEmailOnVersionUpdate = function() {  
        if ($scope.max_patients > $scope.Invites.length) {
          Materialize.toast("Le nombre maximum d'insciptions doit être inférieur à le nombre d'invités: inférieur à " + $scope.Invites.length, 7000, 'blue');
          return;
        }
        if ($scope.InviteEmail) {
          Materialize.toast('Vous n\'avez pas enregistré de participant. Merci de cliquer sur le bouton Plus sur la droite pour sauver l\'e-mail', 7000, 'blue');                  
          return;
        }  
        var state = CommonDataService.getState();            
        var data = {
          Document_ID: fileUpload.getFileName(),
          Doctor_Name: state.FormData.Doctor_Name,
          Doctor_Email: state.FormData.Doctor_Email,
          PDF_Title: $scope.pdf_title,
          Conditions: $scope.cond,
          ExpiresIn: $scope.expires_in,
          Max_Patients: $scope.max_patients,
          Invites: angular.toJson($scope.Invites),
          Today: new Date(),
          Version: state.FormData.Version + 1
        };             
        var LinkHash = fileUpload.getLinkHash();
        if (!LinkHash) {
          Materialize.toast("Merci d'envoyer le fichier", 4000, 'blue');                  
          return;          
        }
        
        $scope.isEmailing = true;
        EmailService
          .SendEmail("https://docchain.stratumn.net/links/" + LinkHash + "/sendEmail", data)
          .then(function(data) {            
            console.log("response data from SendEmail: " + JSON.stringify(data));
            $window.location.href = "/version.html?mapId=" 
                                  + data.link.meta.mapId;
            // $scope.isEmailing = false;
          }, function (err) {        
            // forward to Error Page
            console.log("err = " + JSON.stringify(err)); //$window.location.href = "/oops.html";
          });

      }      

  }]); // end of controller

