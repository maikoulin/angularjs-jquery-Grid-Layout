angular.module("angularTestApp")

  .service("utilService", function () {
    var panelList = [];

    //存储panelList
    function savePanelList(list) {
      panelList = angular.copy(list);
    }

    //获取最新的panelList
    function getPanelList() {
      return panelList;
    }


    function updatePanelList(obj) {
      for (var i = 0; i < panelList.length; i++) {
        if (panelList[i].id == obj.id) {
          panelList[i]['col'] = obj.col;
          panelList[i]['row'] = obj.row;
          panelList[i]['xsize'] = obj.xsize;
          panelList[i]['ysize'] = obj.ysize;
        }
      }
    }


    //获取PanelList
    function getMaxHeightById(id) {
      var heightList = [];
      for (var i = 0; i < panelList.length; i++) {
        if (panelList[i].id != id) {
          var row = panelList[i]['row'] ? panelList[i]['row'] : 0;
          var ysize = panelList[i]['ysize'] ? panelList[i]['ysize'] : 0;
          heightList.push(row + ysize);
        }
      }

      var val = heightList.sort(sortNumber);
      return val.length > 0 ? val[0] : 0;
    }

    //获取PanelList
    function getOtherPanelList(id) {
      var list = [];
      for (var i = 0; i < panelList.length; i++) {
        if (panelList[i].id != id) {
          list.push(panelList[i]);
        }
      }
      return list;
    }

    //获取PanelList中最下一块高度
    function getMaxHeight() {
      var heightList = [];
      for (var i = 0; i < panelList.length; i++) {
        var row = panelList[i]['row'] ? panelList[i]['row'] : 0;
        var ysize = panelList[i]['ysize'] ? panelList[i]['ysize'] : 0;
        heightList.push(row + ysize);
      }
      var val = heightList.sort(sortNumber);
      return val.length > 0 ? val[0] : 0;
    }

    function sortNumber(a, b) {
      return b - a
    }

    function getLayoutItem(layout, id) {
      for (let i = 0, len = layout.length; i < len; i++) {
        if (layout[i].i === id) return layout[i];
      }
    }

    function cloneLayoutItem(layoutItem) {
      return {
        w: layoutItem.w,
        h: layoutItem.h,
        x: layoutItem.x,
        y: layoutItem.y,
        i: layoutItem.i,
        minW: layoutItem.minW,
        maxW: layoutItem.maxW,
        minH: layoutItem.minH,
        maxH: layoutItem.maxH,
        moved: Boolean(layoutItem.moved),
        static: Boolean(layoutItem.static),
        // These can be null
        isDraggable: layoutItem.isDraggable,
        isResizable: layoutItem.isResizable
      };
    }


    return {
      updatePanelList: updatePanelList,
      getMaxHeightById: getMaxHeightById,
      getOtherPanelList: getOtherPanelList,
      savePanelList: savePanelList,
      getMaxHeight: getMaxHeight,
    }


  });
