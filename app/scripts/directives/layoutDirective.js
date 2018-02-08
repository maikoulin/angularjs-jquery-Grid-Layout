angular.module("angularTestApp")

  .directive("layoutDragResize", ['utils', function (utils) {
    return {
      restrict: "AE",
      scope: {
        listData: '=',
        handles: '='

      },
      template: '<item-drag-resize ng-repeat="item in state.layout" resource="item">' +
      '<ng-transclude></ng-transclude>' +
      '</item-drag-resize>',
      transclude: true,
      controller: ["$scope", '$element', function ($scope, $element) {
        function Props() {
          this.autoSize = true;
          this.cols = 12;
          this.className = "";
          this.style = {};
          this.containerPadding = [10, 10];
          this.maxRows = Infinity;
          this.layout = [];
          this.margin = [10, 10];
          this.isDraggable = true;
          this.isResizable = true;
          this.verticalCompact = true;
          this.compactType = "vertical";
          this.preventCollision = false;
        }

        $scope.props = new Props();
        $scope.props.layout = $scope.listData;

        function State() {
          this.activeDrag = null; //LayoutItem
          this.layout = utils.synchronizeLayoutWithChildren(
            $scope.listData,
            $scope.props.cols,
            // Legacy support for verticalCompact= false
            utils.compactType($scope.props)
          );  //Layout
          this.mounted = false;
          this.oldDragItem = null; //LayoutItem
          this.oldLayout = null; //Layout
          this.oldResizeItem = null //LayoutItem
        }

        State.prototype.setState = function (newState) {
          let keys = Object.keys(newState);
          _.map(keys, function (item) {
            $scope.state[item] = newState[item];
          })

        };

        $scope.state = new State();

        function containerHeight() {
          if (!$scope.props.autoSize) return;
          const nbRow = utils.bottom($scope.state.layout);
          const containerPaddingY = $scope.props.containerPadding
            ? $scope.props.containerPadding[1]
            : $scope.props.margin[1];
          return (
            nbRow * $scope.props.rowHeight +
            (nbRow - 1) * $scope.props.margin[1] +
            containerPaddingY * 2
          );
        }

      }],
      link: function ($scope, element, attrs) {

        for (let i = 0, length = $scope.state.layout.length; i < length; i++) {
          $scope.state.layout[i].onDragStart = onDragStart;
          $scope.state.layout[i].onDrag = onDrag;
          $scope.state.layout[i].onDragStop = onDragStop;
          $scope.state.layout[i].onResizeStart = onResizeStart;
          $scope.state.layout[i].onResize = onResize;
          $scope.state.layout[i].onResizeStop = onResizeStop;
        }


        $scope.handles.deletedItem = function (id) {
          let {layout} = $scope.state;
          const {cols} = $scope.props;
          console.log(id);
          $scope.state.layout = _.reject(layout, {i: id});
          let newLayout = utils.compact($scope.state.layout, utils.compactType($scope.props), cols);

          for (let k = 0, length = newLayout.length; k < length; k++) {
            for (let j = 0; j < length; j++) {
              let o = $scope.state.layout[k];
              let n = newLayout[j];
              if (o.i === n.i && (o.x !== n.x || o.y !== n.y)) {
                o.onUpdatePosition(n.x, n.y);
                o.x = n.x;
                o.y = n.y;
              }
            }
          }

        };

        /**
         *
         * @param i
         * @param x  X position of the move
         * @param y  Y position of the move
         * @param e  The mousedown event
         * @param node  node The current dragging DOM element
         * @returns {*}
         */
        function onDragStart(i, x, y, node) {
          let {layout} = $scope.state;
          let l = utils.getLayoutItem(layout, i);
          if (!l) return;
          $scope.state.oldDragItem = utils.cloneLayoutItem(l);
          $scope.state.oldLayout = angular.copy($scope.state.layout);
          initDragShadow(l.x, l.y, l);

        }

        /**
         *
         * @param i   Id of the child
         * @param x    X position of the move
         * @param y    Y position of the move
         * @param e    The mousedown event
         * @param node  {Element} node The current dragging DOM element
         */
        function onDrag(i, x, y, node) {
          let {layout} = $scope.state;
          let {oldLayout} = $scope.state;
          const {cols} = $scope.props;
          const l = utils.getLayoutItem(oldLayout, i);
          if (!l) return;
          // Move the element to the dragged location.
          const isUserAction = true;
          oldLayout = utils.moveElement(
            oldLayout,
            l,
            x,
            y,
            isUserAction,
            $scope.props.preventCollision,
            utils.compactType($scope.props),
            cols
          );
          $scope.$apply(function () {
            const newOldLayout = utils.compact(oldLayout, utils.compactType($scope.props), cols);
            $scope.state.oldLayout = newOldLayout;

            for (let k = 0, length = layout.length; k < length; k++) {
              for (let j = 0; j < length; j++) {
                let o = layout[k];
                let n = newOldLayout[j];
                if (o.i === n.i && n.i !== i && (o.x !== n.x || o.y !== n.y)) {
                  layout[k].onUpdatePosition(n.x, n.y);
                  layout[k].x = n.x;
                  layout[k].y = n.y;
                }
                if (n.i === i) {
                  dragShadow(n.x, n.y, n)
                }
              }
            }
          });
        }

        function onDragStop(i, x, y, node) {
          let {layout} = $scope.state;
          let {oldLayout} = $scope.state;
          const {cols, preventCollision} = $scope.props;
          const l = utils.getLayoutItem(oldLayout, i);
          if (!l) return;

          // Move the element here
          const isUserAction = true;
          oldLayout = utils.moveElement(
            oldLayout,
            l,
            x,
            y,
            isUserAction,
            preventCollision,
            utils.compactType($scope.props),
            cols
          );

          $scope.$apply(function () {
            const newOldLayout = utils.compact(oldLayout, utils.compactType($scope.props), cols);
            $scope.state.oldLayout = newOldLayout;
            const n = utils.getLayoutItem(newOldLayout, i);
            for (let k = 0, len = layout.length; k < len; k++) {
              if (layout[k].i === i) {
                layout[k].x = n.x;
                layout[k].y = n.y;
                layout[k].onUpdatePosition(n.x, n.y);
              }
            }
            $scope.state.setState({
              activeDrag: null,
              oldDragItem: null,
              oldLayout: null
            });
            removeDragShadow();

          });


        }


        function onResizeStart(i, w, h, node) {
          const {layout} = $scope.state;
          const l = utils.getLayoutItem(layout, i);
          if (!l) return;
          $scope.state.oldResizeItem = utils.cloneLayoutItem(l);
          $scope.state.oldLayout = angular.copy(layout);
          initDragShadow(l.x, l.y, l);
        }

        function onResize(i, w, h, node) {
          const {oldLayout, layout} = $scope.state;
          const {cols, preventCollision} = $scope.props;
          const l = utils.getLayoutItem(oldLayout, i);
          if (!l) return;

          // Short circuit if there is a collision in no rearrangement mode.
          if (preventCollision && utils.getFirstCollision(oldLayout, l)) {
            return;
          }

          // Set new width and height.
          l.w = w;
          l.h = h;

          // Re-compact the layout and set the drag placeholder.
          $scope.$apply(function () {
            const newOldLayout = utils.compact(oldLayout, utils.compactType($scope.props), cols);
            $scope.state.oldLayout = newOldLayout;

            for (let k = 0, length = layout.length; k < length; k++) {
              for (let j = 0; j < length; j++) {
                let o = layout[k];
                let n = newOldLayout[j];
                if (o.i === n.i && n.i !== i && (o.x !== n.x || o.y !== n.y)) {
                  layout[k].onUpdatePosition(n.x, n.y);
                  layout[k].x = n.x;
                  layout[k].y = n.y;
                }
                if (n.i === i) {
                  resizeShadow(n.w, n.h, n)
                }
              }
            }
          });
        }

        function onResizeStop(i, w, h, node) {
          const {layout, oldLayout} = $scope.state;
          const {cols} = $scope.props;
          const l = utils.getLayoutItem(oldLayout, i);
          if (!l) return;
          // Set state
          $scope.$apply(function () {
            const newOldLayout = utils.compact(oldLayout, utils.compactType($scope.props), cols);
            $scope.state.oldLayout = newOldLayout;
            const n = utils.getLayoutItem(newOldLayout, i);
            for (let k = 0, len = layout.length; k < len; k++) {
              if (layout[k].i === i) {
                layout[k].w = n.w;
                layout[k].h = n.h;
                layout[k].onUpdateSize(n.x, n.y, n.w, n.h);
              }
            }
            $scope.state.setState({
              activeDrag: null,
              oldDragItem: null,
              oldLayout: null
            });
            removeDragShadow();

          });
        };


        let panel_shadow;

        function initDragShadow(x, y, item) {
          $("#layout-drag-resize").append("<div  class='panel-shadow'></div>");
          panel_shadow = angular.element(document.querySelector('.panel-shadow'));
          panel_shadow.css({
            top: y * item.rowHeight,
            left: x * item.colWidth,
            width: item.w * item.colWidth,
            height: item.h * item.rowHeight,
            background: "#985f0d",
            position: "absolute",
          });
          panel_shadow.css({"transition-duration": '.3s'});
        }

        function dragShadow(x, y, item) {

          panel_shadow.css({
            top: y * item.rowHeight,
            left: x * item.colWidth,
          })


        }

        function resizeShadow(w, h, item) {

          panel_shadow.css({
            width: w * item.colWidth,
            height: h * item.rowHeight,
            top: item.y * item.rowHeight,
            left: item.x * item.colWidth,
          })


        }

        function removeDragShadow() {
          setTimeout(function () {
            panel_shadow.css({"transition-duration": '0s'});
          }, 300);
          panel_shadow.remove()
        }
      }

    }
  }]);
