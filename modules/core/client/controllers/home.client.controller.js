(function () {
  'use strict';

  angular
    .module('core')
    .controller('HomeController', HomeController);

    HomeController.$inject = ['$scope', '$state', '$location', 'Authentication', '$filter', 'UserFactory', 'Socket', '$sce'];

  function HomeController($scope, $state, $location, Authentication, $filter, UserFactory, Socket, $sce) {
    var vm = this;

    // inviteReceived and loader should eventually be moved to their own file with the other socket call system code
    vm.$sce = $sce;
    vm.inviteReceived = false;
    vm.rsvpDeclined = false;
    vm.loader = false;
    vm.authentication = Authentication;
    vm.videoCall = false;
    vm.buildPager = buildPager;
    vm.figureOutItemsToDisplay = figureOutItemsToDisplay;
    vm.pageChanged = pageChanged;

    if (vm.authentication.user) {
      Socket.emit('signedIn', vm.authentication.user);
    }

    vm.getStarted = function() {
      $location.path('/authentication/signup');
    }

    // videoChat is the function that triggers the socket call system



    // step 2. (occurs in socket.io.js) listen for 'initVideoCall' in config/lib/socket.io.js under the 'connection' listener.
      // 2a. put together a data object that will be able to assemble the socket room that only the receiving user is listening to.
      // 2b. emit an event called 'deliverInvite' into that room that will trigger the invite card to be viewable within the receiving user's view at the level of index.html and pass data about the sender and the receiver

    // step 3. listen for the event in the home controller and offer the option to accept or reject the request for videoChat

    vm.videoChat = function(sender, receiver) {
      vm.loader = true;
      var senderRoom = 'room' + sender.username;
      var receiverRoom = 'room' + receiver.username;
      var inviteUrl = 'https://meet.jit.si/' + receiver.username + 'yakkinWith' + sender.username;
       var inviteData = {
         sender: sender,
         receiver: receiver,
         link: inviteUrl,
         senderRoom: senderRoom,
         receiverRoom: receiverRoom
      };

       vm.invitation = inviteData;

      // --> step 1. emit 'initVideoCall' on the front end and send data objects for both sender and receivers
      Socket.emit('initVideoCall', inviteData);
    };

    // step 3. listen for the event in the home controller and offer the option to accept or reject the request for videoChat
    Socket.on('deliverInvite', function(inviteData) {
      $scope.$apply(function() {
        vm.inviteReceived = true;
        vm.invitation = inviteData;
      });
    });

    // Run this function if the receiving party agrees to accept the video call
    vm.inviteAccepted = function(rsvp) {
      vm.inviteReceived = false;
      vm.videoCall = true;
      Socket.emit('inviteAccepted', rsvp);
    };

    Socket.on('returnRsvp', function(rsvp) {
      $scope.$apply(function() {
        vm.loader = false;
        vm.search = '';
        vm.videoCall = true;
        // the state change occurs here
      });
    });

    // Run this function if the receiving party declines the video call
    vm.inviteDeclined = function(rsvp) {
      vm.inviteReceived = false;
      Socket.emit('inviteDeclined', rsvp);
    };

    Socket.on('rsvpToDecline', function(rsvp) {
      $scope.$apply(function () {
        vm.rsvp = rsvp;
        vm.search = '';
        vm.loader = false;
        vm.rsvpDeclined = true;
      });
    });

    vm.cancelCall = function(invitation) {
      var room = 'room' + vm.invitation.receiver.username;
      vm.loader = false;
      vm.search = '';
      Socket.emit('cancelCall', invitation);
    };

    Socket.on('cancelCall', function () {
      vm.inviteReceived = false;
    });

    vm.responseAcknowledged = function () {
      vm.rsvpDeclined = false;
      vm.loader = false;
    };

    vm.hangup = function (invitation) {
      console.log('user has hung up');
      vm.videoCall = false;
      Socket.emit('hangUp', invitation);
    };

    Socket.on('endCall', function () {
      console.log('endCall socket event received');
      vm.videoCall = false;
    });


    UserFactory.query(function (data) {
      vm.users = data;
      vm.buildPager();
      // console.log(Socket);
      // console.log(vm.users);
    });

    function buildPager() {
      vm.pagedItems = [];
      vm.itemsPerPage = 15;
      vm.currentPage = 1;
      vm.figureOutItemsToDisplay();
    }

    function figureOutItemsToDisplay() {
      vm.filteredItems = $filter('filter')(vm.users, {
        $: vm.search
      });
      vm.filterLength = vm.filteredItems.length;
      var begin = ((vm.currentPage - 1) * vm.itemsPerPage);
      var end = begin + vm.itemsPerPage;
      vm.pagedItems = vm.filteredItems.slice(begin, end);
    }

    function pageChanged() {
      vm.figureOutItemsToDisplay();
    }
  }
}());
