angular.module("angularTestApp")

  .directive("itemDragResize", function () {
    return {
      restrict: "AE",
      scope: {
        dateResource: '=',
      },
      replace: true,
      template: '<div class="ui-widget-content grid-item' + " {{dateResource.className}}" + ' " >' +
      '[{{dateResource.x}},{{dateResource.y}},{{dateResource.w}},{{dateResource.h}} ] ' +
      '<ng-transclude></ng-transclude>' +
      '</div>',
      transclude: true,
      controller: ["$scope", '$element', function ($scope, $element) {
        function Props() {
          this.children = $element;
          this.cols = $scope.dateResource.cols;
          this.containerWidth = $scope.dateResource.containerWidth;
          this.margin = $scope.dateResource.margin ? $scope.dateResource.margin : [0, 0];
          this.containerPadding = $scope.dateResource.containerPadding ? $scope.dateResource.containerPadding : [0, 0];
          this.rowHeight = $scope.dateResource.rowHeight;
          this.colWidth = $scope.dateResource.colWidth;

          this.maxRows = $scope.dateResource.maxRows;
          this.isDraggable = $scope.dateResource.isDraggable;
          this.isResizable = $scope.dateResource.isResizable;
          this.static = $scope.dateResource.static;

          this.className = $scope.dateResource.className;
          this.style = $scope.dateResource.style;


          this.x = $scope.dateResource.x;
          this.y = $scope.dateResource.y;
          this.w = $scope.dateResource.w;
          this.h = $scope.dateResource.h;


          this.minW = $scope.dateResource.minW;
          this.maxW = $scope.dateResource.maxW;
          this.minH = $scope.dateResource.minH;
          this.maxH = $scope.dateResource.maxH;
          this.i = $scope.dateResource.i;
          this.onDrag = $scope.dateResource.onDrag;
          this.onDragStart = $scope.dateResource.onDragStart;
          this.onDragStop = $scope.dateResource.onDragStop;
          this.onResize = $scope.dateResource.onResize;
          this.onResizeStart = $scope.dateResource.onResizeStart;
          this.onResizeStop = $scope.dateResource.onResizeStop
        }

        $scope.props = new Props();

        function State() {
          this.resizing = {width: 0, height: 0};
          this.dragging = {top: 0, left: 0};
          this.className = ""
        }

        State.prototype.setState = function (newState) {
          let keys = Object(newState);
          _.map(keys, function (item) {
            $scope.state[item] = newState[item]
          })
        };

        $scope.state = new State();

      }],
      link: function ($scope, element, attrs) {

        const gridItem = $(element);
        $scope.dateResource.onUpdatePosition = function (x, y) {
          gridItem.css({"transition-duration": '.3s'});
          gridItem.css({
            top: y * $scope.props.rowHeight,
            left: x * $scope.props.colWidth,
          });
          setTimeout(function () {
            gridItem.css({"transition-duration": '0s'});
          }, 300);
        };
        $scope.dateResource.onUpdateSize = function (x, y, w, h, colWidth, rowHeight) {
          if (colWidth) {
            $scope.props.colWidth = colWidth
          }
          if (rowHeight) {
            $scope.props.rowHeight = rowHeight
          }
          const width = w * $scope.props.colWidth,
            height = h * $scope.props.rowHeight;
          gridItem.css({"transition-duration": '.3s'});
          gridItem.css({
            top: y * $scope.props.rowHeight,
            left: x * $scope.props.colWidth,
            width: width,
            height: height
          });
          gridItem.find('.drag-resize-container').css({"width": '100%', "height": height - 40});
          setTimeout(function () {
            gridItem.css({"transition-duration": '0s'});
          }, 300);
        };

        const width = $scope.props.w * $scope.props.colWidth,
          height = $scope.props.h * $scope.props.rowHeight;
        gridItem.css({
          top: $scope.props.y * $scope.props.rowHeight,
          left: $scope.props.x * $scope.props.colWidth,
          width: width,
          height: height
        });
        gridItem.find('.drag-resize-container').css({"width": '100%', "height": height - 40});//初始化


        if ($scope.props.isDraggable) {
          gridItem.draggable(
            {
              zIndex: 100,
              delay: 100,
              handle: "#title",
              start: function (event, ui) {
                $(event.target).css({opacity: 0.7});
                onDragHandler(event, ui, "onDragStart");
              },
              drag: function (event, ui) {
                onDragHandler(event, ui, "onDrag");
              },
              stop: function (event, ui) {
                $(event.target).css({"z-index": 0, opacity: 1});
                onDragHandler(event, ui, "onDragStop");
              },


            }
          );
        }


        if ($scope.props.isResizable) {
          gridItem.resizable({
            start: function (event, ui) {
              $(event.target).css({"z-index": 100, opacity: 0.7});
              onResizeHandler(event, ui, "onResizeStart")

            },
            resize: function (event, ui) {
              onResizeHandler(event, ui, "onResize")

            },
            stop: function (event, ui) {
              $(event.target).css({"z-index": 0, opacity: 1});
              onResizeHandler(event, ui, "onResizeStop")
            }

          });
        }

        /**
         *
         * @param node Event
         * @param ui   ui
         * @param handlerName
         */

        function onDragHandler(node, ui, handlerName) {

          const handler = $scope.props[handlerName];
          if (!handler) return;

          const newPosition = {top: 0, left: 0};

          // Get new XY
          switch (handlerName) {
            case "onDragStart": {
              newPosition.left = ui.originalPosition.left;
              newPosition.top = ui.originalPosition.top;
              $scope.state.setState({dragging: newPosition});
              break;
            }
            case "onDrag":
              if (!$scope.state.dragging)
                throw new Error("onDrag called before onDragStart.");
              newPosition.left = ui.position.left;
              newPosition.top = ui.position.top;
              $scope.state.setState({dragging: newPosition});
              break;
            case "onDragStop":
              if (!$scope.state.dragging)
                throw new Error("onDragEnd called before onDragStart.");
              newPosition.left = ui.position.left;
              newPosition.top = ui.position.top;
              $scope.state.setState({dragging: null});
              break;
            default:
              throw new Error(
                "onDragHandler called with unrecognized handlerName: " + handlerName
              );
          }
          const {x, y} = calcXY(newPosition.top, newPosition.left);
          handler.call(this, $scope.props.i, x, y, node)
        }


        /**
         *
         * @param node
         * @param ui
         * @param handlerName
         */
        function onResizeHandler(node, ui, handlerName) {
          const handler = $scope.props[handlerName];
          if (!handler) return;
          const {cols, x, i, maxW, minW, maxH, minH} = $scope.props;
          // Get new XY
          let {w, h} = calcWH(ui.size);

          // Cap w at numCols
          w = Math.min(w, cols - x);
          // Ensure w is at least 1
          w = Math.max(w, 1);

          // Min/max capping
          w = Math.max(Math.min(w, maxW), minW);
          h = Math.max(Math.min(h, maxH), minH);

          $scope.state.setState({resizing: handlerName === "onResizeStop" ? null : ui.size});

          handler.call(this, i, w, h, node);

        }

        /**
         *
         * @param top  top  Top position
         * @param left  left Left position
         * @returns {{x: number, y: number}}
         */
        function calcXY(top, left) {
          const {margin, cols, rowHeight, w, h, maxRows} = $scope.props;
          const colWidth = calcColWidth();

          let x = Math.round((left - margin[0]) / (colWidth + margin[0]));
          let y = Math.round((top - margin[1]) / (rowHeight + margin[1]));

          // Capping
          x = Math.max(Math.min(x, cols - w), 0);
          y = Math.max(Math.min(y, maxRows - h), 0);

          return {x, y};
        }

        function calcWH({height, width}) {
          const {margin, maxRows, cols, rowHeight, x, y} = $scope.props;
          const colWidth = calcColWidth();

          let w = Math.round((width + margin[0]) / (colWidth + margin[0]));
          let h = Math.round((height + margin[1]) / (rowHeight + margin[1]));

          // Capping
          w = Math.max(Math.min(w, cols - x), 0);
          h = Math.max(Math.min(h, maxRows - y), 0);
          return {w, h};
        }


        function calcColWidth() {
          const {margin, containerPadding, containerWidth, cols} = $scope.props;
          return (
            (containerWidth - margin[0] * (cols - 1) - containerPadding[0] * 2) / cols
          );
        }


      }
    }
  });
