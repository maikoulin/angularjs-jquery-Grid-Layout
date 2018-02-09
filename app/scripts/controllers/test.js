angular.module('angularTestApp')
  .controller('TestCtrl', ['$scope', "utils", "$timeout", function ($scope, utils, $timeout) {


    function Props() {
      this.autoSize = true;
      this.cols = 12;
      this.className = "";
      this.style = {};
      this.containerPadding = [0, 0];
      this.maxRows = Infinity; // infinite vertical growth
      this.layout = [];
      this.margin = [0, 0];
      this.isDraggable = true;
      this.isResizable = true;
      this.verticalCompact = true;
      this.compactType = "vertical";
      this.preventCollision = false;
    }

    $scope.props = new Props();

    $scope.handles = {};

    const colWidth = getContainerWidth() / 12;
    const rowHeight = 80;
    $scope.props.layout = generateLayout();


    function generateLayout() {
      return _.map(_.range(0, 25), function (item, i) {
        const y = Math.ceil(Math.random() * 3) + 1;
        return {
          x: (_.random(0, 5) * 2) % 12,
          y: Math.floor(i / 6) * y,
          w: 2,
          h: y,
          i: i.toString(),
          colWidth: colWidth,
          isDraggable: true,
          isResizable: true,
          rowHeight: rowHeight,
          margin: $scope.props.margin,
          containerPadding: $scope.props.containerPadding,
          className: $scope.props.className,
          cols: 12,
          maxRows: Infinity,
          verticalCompact: true,
          compactType: "vertical",
          containerWidth: getContainerWidth(),
          minH: 1,
          minW: 1,
          maxH: Infinity,
          maxW: Infinity,
        };
      });
    }

    function getContainerWidth() {
      return $("#layout-container").width();
    }

    $scope.onClickDeleted = function (item) {
      $scope.handles.deletedItem(item.i)
    };

    $scope.onClickAdded = function () {
      $scope.handles.addedItem()
    }


  }]);
