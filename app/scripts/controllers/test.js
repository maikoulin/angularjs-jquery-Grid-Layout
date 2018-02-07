angular.module('angularTestApp')
  .controller('TestCtrl', ['$scope', "utils", "$timeout", function ($scope, utils, $timeout) {


    function Props() {
      this.autoSize = true;
      this.cols = 12;
      this.className = "";
      this.style = {};
      this.containerPadding = [10, 10];
      this.maxRows = Infinity; // infinite vertical growth
      this.layout = [];
      this.margin = [10, 10];
      this.isDraggable = true;
      this.isResizable = true;
      this.verticalCompact = true;
      this.compactType = "vertical";
      this.preventCollision = false;
    }

    $scope.props = new Props();


    const colWidth = $("#testList").width() / 12;
    const rowHeight = 100;
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
      return $("#testList").width();
    }


  }]);
