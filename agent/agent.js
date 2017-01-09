var fs = require('fs');
var crypto = require('crypto');
var Bitcore = require('bitcore-lib');
var Message = require('bitcore-message');
var bs58 = require('bs58');
var AWS = require('aws-sdk');

/**
 * Put AWS credentials here.
 */
AWS.config.update({ 
  "accessKeyId": "", 
  "secretAccessKey": "", 
  "region": "" 
});

/**
 * Put Sendgrid credentials here.
 */
var SENDGRID_APIKEY = "";

module.exports = {
  /**
   * This is a called when a new map is created.
   * It is responsible for creating the first link of a map.
   */
  init: function(data) {
    // You can modify the state of the first link and add values.
    // Here we setup up a title, a timestamp, and an empty message list.
    var that = this;
    var s3 = new AWS.S3();
    var params = {Bucket: 'file-upload-stratumn', Key: data.name, ContentType: data.type};
    s3.getSignedUrl('putObject', params, function(err, url) { //UPLOADS FILE
      if (err) {
        that.reject();
        return;
      }
      that.state.FormData = {Document_ID: data.name};
      that.state.SignedURLToUpload = url;
      that.meta.tags = ["method__init"];
      that.append();
    });
  },

  getSignedUrlToUpload: function(data) {
    var that = this;
    var s3 = new AWS.S3();
    var params = {Bucket: 'file-upload-stratumn', Key: data.name, ContentType: data.type};
    s3.getSignedUrl('putObject', params, function(err, url) { //UPLOADS FILE
      if (err) {
        that.reject();
        return;
      }
      that.meta.tags = ["method__SignedUrlToUpload"]; that.meta.priority = ""; 
      that.state.SignedURLToUpload = url;
      that.append();
    });
  },

  getSignedUrlToView: function(FileName) {
    FileName = this.state.FormData.Document_ID;
    var that = this;
    var s3 = new AWS.S3();
    var params = {
      Bucket: 'file-upload-stratumn', 
      Key: FileName,     
      Expires: 600
    };
    var url = s3.getSignedUrl('getObject', params, function (err, url) {
      if(err) {
        that.reject();
        return;
      }
      that.meta.tags = ["method__SignedUrlToView"]; that.meta.priority = ""; 
      that.state.SignedURLToView = url;
      that.append();      
    });    
  },

  sendEmail: function(data){ 
    var sendgrid = require("sendgrid")(SENDGRID_APIKEY);
    var linkURL = "https://docchain.stratumn.com/sign.html?linkhash="   
      + this.linkHash + "&address=";
    var s3 = new AWS.S3();
    var params = {Bucket: 'file-upload-stratumn', Key: data.Document_ID};    
    var reader = s3.getObject(params).createReadStream();
    var hash = crypto.createHash('sha256');
    var that = this; 
    data.Invites = JSON.parse(data.Invites); 
    that.meta.tags = [data.Document_ID, "consent"];
    that.meta.priority = data.Version;
    var InvitesLength = data.Invites.length;

    reader.on('error', function(err) {
      // error handling      
      that.state.error = err; that.append(); return;
    });

    reader.on('data', function (data) {      
      hash.update(data); 
    });

    reader.on('end', function () {
      var res = hash.digest('hex');
      data.FileHash = res; 
      that.meta.tags.push(res);
      that.meta.tags.push("method__sendEmail");
      var keys = [];
      data.Invites.forEach(function(item, i){
        var privateKey = new Bitcore.PrivateKey(); 
        var WIF = privateKey.toWIF(); 
        var publicKey = privateKey.toPublicKey(); 
        var address = undefined; 
        address = publicKey.toAddress(Bitcore.Networks.livenet); 
        data.Invites[i] = 
          ({ Email: data.Invites[i].Email, Name: data.Invites[i].Name, Address: address});                 
        var email = new sendgrid.Email(); 
        email.addTo(item.Email); 
        email.setFrom(data.Doctor_Email);
        email.setSubject(data.PDF_Title);
        var linkURLEmail  = linkURL + privateKey;
        var HTMLText = 
                    `Bonjour ${item.Name},<br/>
                    ${data.Conditions}
                    <p>Vous trouverez à cette adresse</p>
                    <p>${linkURLEmail}</p>
                    <p>le lien vers le formulaire de consentement au protocole. Nous vous invitons à prendre le soin de le lire attentivement avant d’accepter.</p>
                    <p>Pour toute information relative à ce formulaire, veuillez vous adresser à l’investigateur-coordinateur dont le contact se trouve ci-après.</p>
                    <p>Pour toute autre information, veuillez adresser un email à l’adresse : secretariat.epidemiologie@labo.fr</p>
                    <p>Cordialement,<br/>
                    <p>Le laboratoire</p>  
                    </p>`;        
        email.setHtml(HTMLText); 
        sendgrid.send(email, function(data, err){ 
          data.Invites[i] = 
            ({ Email: data.Invites[i].Email, Name: data.Invites[i].Name, Address: address, EmailResponse: JSON.stringify(err), Index: i});
        });         
      });

      !(function(that, data){
        setTimeout(function(){
        var email = new sendgrid.Email(); 
        email.addTo(data.Doctor_Email);
        email.setFrom(data.Doctor_Email);
        email.setSubject(data.PDF_Title);
        var linkURLEmail = "https://docchain.stratumn.com/version.html?mapId=" 
                     + that.meta.mapId;
        var HTMLText = "Hello "+ data.Doctor_Name + ",<br/>"
                     + "<p>You just emailed patients. <br/>"
                     + "To verify who signed, please use the link below: <br/>" 
                     + "<a href='" + linkURLEmail + "'>" + linkURLEmail + "</a></p></br>"
                     + "Thank you,<br/>Stratumn";
        email.setHtml(HTMLText); 
        sendgrid.send(email, function(data, err){    
          //
        });         

        that.state.FormData = data;
        that.append(); return;
        }, 0);
      })(that, data);
    });
  },
  
  getConsentForSigning: function(WIF) { //implement Address Not Found
    var privateKey = Bitcore.PrivateKey.fromWIF(WIF);    
    var address = privateKey.toPublicKey().toAddress(Bitcore.Networks.livenet); 
    var Details = this.state.FormData.Invites.filterObjects("Address", address);
    if (Details.length) {
      this.state.FormData.Detail = Details[0];               
      var message = Message(this.state.FormData.FileHash);
      var signature = message.sign(privateKey);
      this.state.FormData.Signature = signature; 
      this.meta.tags = ["method__getConsentForSigning"];      
      this.meta.priority = ""; 
    }     
    else {
      this.reject("No Address Found");
    }
    this.append();
  },

  saveSignature: function(data) {
    // data.DateSigned, data.WIF, data.Signature, data.Consent
    var privateKey = Bitcore.PrivateKey.fromWIF(data.WIF);    
    var address = privateKey.toPublicKey().toAddress(Bitcore.Networks.livenet);     
    PatientIndex = this.state.FormData.Invites.indexOfObjects("Address", address);    
    if (PatientIndex > -1) {
      var verified = Message(this.state.FormData.FileHash).verify(address, data.Signature);
      if (verified) {
        this.meta.tags = [
          // this.state.FormData.Document_ID,
          "signature",
          this.state.FormData.Invites[PatientIndex].Name,
          this.state.FormData.Invites[PatientIndex].Email,
          data.Consent,
          data.Signature,
          address,
          data.DateSigned,
          "method__saveSignature"
        ];
        this.meta.priority = PatientIndex;        
        this.append();

        // sendemail to Doctor & Patient
        var that = this;
        var sendgrid = require("sendgrid")(SENDGRID_APIKEY);
        var email = new sendgrid.Email(); 
        email.addTo(this.state.FormData.Invites[PatientIndex].Email); 
        email.setFrom(this.state.FormData.Doctor_Email);
        email.setSubject(this.state.FormData.PDF_Title);
        var consentString = "";
        if (data.Consent == 1) {
          consentString = "approbation";
        }
        else {
          consentString = "refus";
        }
        var HTMLText = 
                    `Bonjour ${this.state.FormData.Invites[PatientIndex].Name},<br/>
                    <p>Vous venez de signer le formulaire de consentement V.${this.state.FormData.Version} du protocole ${this.state.FormData.PDF_Title} avec votre ${consentString}. Nous vous en remercions.</p>
                    <p>Pour toute information relative au formulaire, veuillez vous adresser à l’investigateur-coordinateur dont le contact se trouve ci-après.</p>
                    <p>Pour toute autre information, veuillez adresser un email à l’adresse :  secretariat.epidemiologie@labo.fr</p>
                    <p>Cordialement,<br/>
                    <p>Le laboratoire</p>  
                    </p>`;
        email.setHtml(HTMLText); 
        sendgrid.send(email, function(data, err){ 
          var email = new sendgrid.Email(); 
          email.addTo(that.state.FormData.Doctor_Email); 
          email.setFrom(that.state.FormData.Doctor_Email);
          email.setSubject(that.state.FormData.PDF_Title);
          var HTMLText = "Hello "+ that.state.FormData.Doctor_Name + ",<br/>"
                       + "<p>Please be advised that " + that.state.FormData.Invites[PatientIndex].Name
                       + " just signed the consent form Version#"
                       + that.state.FormData.Version + " with a " 
                       + consentString 
                       // + ". You can check it at<br/>"
                       // + "https://docmap.stratumn.com/version.html?mapId=" 
                       // + that.meta.mapId + 
                       + ".</p>Thank you,<br/> Stratumn Support"; 
          email.setHtml(HTMLText); 
          sendgrid.send(email, function(data, err){ 
            // that.append();              
          });             

        });             
      }
      else {
        this.reject("Signature can not be verified with the address");
      }
    }     
    else {
      // this.state = {err: "No Address Found"};
      this.reject("No Address Found in the list of patients");
    }
  },

  verifySignature: function(data) {        
    var verified = ""; //Message(this.state.FormData).verify(data.address, data.signature);
    this.state = ""; this.meta.tags = ""; this.meta.priority = ""; 
    this.state.Verified = verified;
    this.meta.tags = ["method__verifySignature"];
    this.append();
  },

  cancel: function() { // Add Email code
    this.state = ""; this.state.canceled = "1";
    this.meta.tags = ["canceled"];       
    this.append();    
  }

};

Array.prototype.filterObjects = function(key, value) {
return this.filter(function(x) { return (JSON.stringify(x[key]) === JSON.stringify(value)); })
} 
Array.prototype.indexOfObjects = function(key, value) {
return this.map(function(x) { return JSON.stringify(x[key])}).indexOf(JSON.stringify(value));
}
