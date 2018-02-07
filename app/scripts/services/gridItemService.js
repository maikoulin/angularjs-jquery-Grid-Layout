angular.module("angularTestApp")

  .service('gridItemService', ['utils', function (utils) {

    return {
      // PartialPosition: {
      //   top: number,
      //   left: number
      // }
      // ,
      // State: {
      //   resizing: {width: number, height: number},
      //   dragging: {top: number, left: number},
      //   className: String
      // },
      // GridItemCallback: function (event) {
      //
      // },
      // Props: {
      //   children: Element,
      //   cols: number,
      //   containerWidth: number,
      //   margin: [number, number],
      //   containerPadding: [number, number],
      //   rowHeight: number,
      //   maxRows: number,
      //   isDraggable: Boolean,
      //   isResizable: Boolean,
      //   static: Boolean,
      //   useCSSTransforms: Boolean,
      //   usePercentages: Boolean,
      //
      //   className: String,
      //   style: Object,
      //   // Draggability
      //   cancel: String,
      //   handle: String,
      //
      //   x: number,
      //   y: number,
      //   w: number,
      //   h: number,
      //
      //   minW: number,
      //   maxW: number,
      //   minH: number,
      //   maxH: number,
      //   i: String,
      //
      //   onDrag: this.GridItemCallback(utils.GridDragEvent),
      //   onDragStart: this.GridItemCallback(utils.GridDragEvent),
      //   onDragStop: this.GridItemCallback(utils.GridDragEvent),
      //   onResize: this.GridItemCallback(utils.GridResizeEvent),
      //   onResizeStart: this.GridItemCallback(utils.GridResizeEvent),
      //   onResizeStop: this.GridItemCallback(utils.GridResizeEvent)
      // }


    }
  }])
;
