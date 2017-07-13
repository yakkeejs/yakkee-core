(function () {
  'use strict';

  angular.module('core')
    .directive('signedIn', signedIn);

  signedIn.$inject = [];

  function signedIn() {
    var directive = {
      controller: "AuthenticationController"
    };

    return directive;
  }
}());
