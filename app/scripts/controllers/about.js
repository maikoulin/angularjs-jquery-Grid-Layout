'use strict';

/**
 * @ngdoc function
 * @name angularTestApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the angularTestApp
 */
angular.module('angularTestApp')
  .controller('AboutCtrl', ['$scope', 'utilService', function ($scope, utilService) {
    $scope.chartList = generateLayout();
    $scope.dataPerHeight = 100;

    utilService.savePanelList($scope.chartList);
    setPanelWrapperHeight();

    //设置当前面板的高度
    function setPanelWrapperHeight() {
        var maxHeight = utilService.getMaxHeight();
        angular.element(".layout-container").css({"height": (maxHeight + 1) * $scope.dataPerHeight});

    }

    function generateLayout() {
      return _.map(_.range(0, 25), function (item, i) {
        var y = Math.ceil(Math.random() * 4) + 1;
        return {
          col: (_.random(0, 5) * 2) % 12,
          row: Math.floor(i / 6) * y,
          xsize: 2,
          ysize: y,
          id: i
        };
      });
    }

  }]);
