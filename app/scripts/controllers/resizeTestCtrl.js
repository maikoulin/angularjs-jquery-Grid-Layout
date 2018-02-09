angular.module('angularTestApp')
  .controller('resizeTestCtrl', ['$scope', "utils", "$timeout", function ($scope, utils, $timeout) {


    $("#resizable").resizable();
  }]);
