'use strict';

/**
 * @ngdoc function
 * @name angularTestApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the angularTestApp
 */
angular.module('angularTestApp')
  .controller('MainCtrl', ['$scope', "utils", "$timeout", function ($scope, utils, $timeout) {

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

    const props = new Props();


    function State() {
      this.activeDrag = null; //LayoutItem
      this.layout = utils.synchronizeLayoutWithChildren(
        props.layout,
        props.cols,
        // Legacy support for verticalCompact= false
        compactType()
      );  //Layout
      this.mounted = false;
      this.oldDragItem = null; //LayoutItem
      this.oldLayout = null; //Layout
      this.oldResizeItem = null //LayoutItem
    }

    State.prototype.setState = function (newState) {
      let keys = Object.keys(newState);
      _.map(keys, function (item) {
        $scope.testList[item] = newState[item];
      })

    };

    const colWidth = $("#testList").width() / 12;
    const rowHeight = 50;
    props.layout = generateLayout();


    $scope.testList = new State();


    function generateLayout() {
      return _.map(_.range(0, 25), function (item, i) {
        var y = Math.ceil(Math.random() * 3) + 1;
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
          margin: props.margin,
          containerPadding: props.containerPadding,
          className: props.className,
          cols: 12,
          maxRows: Infinity,
          verticalCompact: true,
          compactType: "vertical",
          containerWidth: getContainerWidth(),
          minH: 1,
          minW: 1,
          maxH: Infinity,
          maxW: Infinity,
          onDragStop: onDragStop,
          onDragStart: onDragStart,
          onDrag: onDrag,
          onResizeStart: onResizeStart,
          onResize: onResize,
          onResizeStop: onResizeStop
        }
          ;
      });
    }

    function children() {
      return $("#testList").children();
    }

    function getContainerWidth() {
      return $("#testList").width();
    }

    function compactType(prop) {
      if (!prop) prop = props;
      return prop.verticalCompact === false ? null : prop.compactType;
    }


    function containerHeight() {
      if (!props.autoSize) return;
      const nbRow = utils.bottom($scope.testList.layout);
      const containerPaddingY = props.containerPadding
        ? props.containerPadding[1]
        : props.margin[1];
      return (
        nbRow * props.rowHeight +
        (nbRow - 1) * props.margin[1] +
        containerPaddingY * 2
      );


    }


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
      let {layout} = $scope.testList;
      let l = utils.getLayoutItem(layout, i);
      if (!l) return;
      $scope.testList.oldDragItem = utils.cloneLayoutItem(l);
      $scope.testList.oldLayout = angular.copy($scope.testList.layout);
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
      let {layout} = $scope.testList;
      let {oldLayout} = $scope.testList;
      const {cols} = props;
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
        props.preventCollision,
        compactType(),
        cols
      );
      $scope.$apply(function () {
        const newOldLayout = utils.compact(oldLayout, compactType(), cols);
        $scope.testList.oldLayout = newOldLayout;

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
      let {layout} = $scope.testList;
      let {oldLayout} = $scope.testList;
      const {cols, preventCollision} = props;
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
        compactType(),
        cols
      );

      $scope.$apply(function () {
        const newOldLayout = utils.compact(oldLayout, compactType(), cols);
        $scope.testList.oldLayout = newOldLayout;
        const n = utils.getLayoutItem(newOldLayout, i);
        for (let k = 0, len = layout.length; k < len; k++) {
          if (layout[k].i === i) {
            layout[k].x = n.x;
            layout[k].y = n.y;
            layout[k].onUpdatePosition(n.x, n.y);
          }
        }
        $scope.testList.setState({
          activeDrag: null,
          oldDragItem: null,
          oldLayout: null
        });
        removeDragShadow();

      });


    }


    function onResizeStart(i, w, h, node) {
      const {layout} = $scope.testList;
      const l = utils.getLayoutItem(layout, i);
      if (!l) return;
      $scope.testList.oldResizeItem = utils.cloneLayoutItem(l);
      $scope.testList.oldLayout = angular.copy(layout);
      initDragShadow(l.x, l.y, l);
    }

    function onResize(i, w, h, node) {
      const {oldLayout, layout} = $scope.testList;
      const {cols, preventCollision} = props;
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
        const newOldLayout = utils.compact(oldLayout, compactType(), cols);
        $scope.testList.oldLayout = newOldLayout;

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
      const {layout, oldLayout} = $scope.testList;
      const {cols} = props;
      const l = utils.getLayoutItem(oldLayout, i);
      if (!l) return;
      // Set state
      $scope.$apply(function () {
        const newOldLayout = utils.compact(oldLayout, compactType(), cols);
        $scope.testList.oldLayout = newOldLayout;
        const n = utils.getLayoutItem(newOldLayout, i);
        for (let k = 0, len = layout.length; k < len; k++) {
          if (layout[k].i === i) {
            layout[k].w = n.w;
            layout[k].h = n.h;
            layout[k].onUpdateSize(n.x, n.y, n.w, n.h);
          }
        }
        $scope.testList.setState({
          activeDrag: null,
          oldDragItem: null,
          oldLayout: null
        });
        removeDragShadow();

      });
    };


    let panel_shadow;

    function initDragShadow(x, y, item) {
      $("#testList").append("<div  class='panel-shadow'></div>");
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


  }]);
