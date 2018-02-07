angular.module("angularTestApp")

  .directive("gridItem", ['$rootScope', 'utilService', function ($rootScope, utilService) {
    return {
      restrict: "AE",
      scope: {
        dataId: '=dataId'
      },
      controller: ["$scope", function ($scope) {
      }],
      link: function (scope, element, attrs) {

        var gridItem = {};


        //获取新的宽高
        var getNewWidthHeight = function () {
          panel_perWidth = parseInt($(element).parent().attr('data-per-width'));
          panel_perHeight = parseInt($(element).parent().attr('data-per-height'));
        };

        //初始化块配置
        var panel_perWidth, panel_perHeight, e_width, e_height, e_left, e_top, panel_list;
        var init = function () {
          getNewWidthHeight();
          e_width = (parseInt(element.attr('data-xsize')) * panel_perWidth);
          e_height = (parseInt(element.attr('data-ysize')) * panel_perHeight);
          e_left = (parseInt(element.attr('data-col')) * panel_perWidth);
          e_top = (parseInt(element.attr('data-row')) * panel_perHeight);
          element.css({"width": e_width, "height": e_height, "top": e_top, "left": e_left});//根据4值初始化
          element.find('.draw-chart-wrapper').css({"width": e_width - 20, "height": e_height - 67});//初始化画图框
          element.attr('data-x', e_left).attr('data-y', e_top);//拖动过程记录的temp值
          panel_list = utilService.getOtherPanelList(parseInt(element.attr('data-id')));
        };
        init();
        scope.$watch('dataId', function (newVal) {
          init();
        }, true);
        scope.$watch(function () {
          return $(element).parent().attr('data-per-width');
        }, function () {

          panel_perWidth = $(element).parent().attr('data-per-width');
          history_x = e_left = (parseInt(element.attr('data-col')) * panel_perWidth);
          element.attr('data-x', e_left);
          e_width = (parseInt(element.attr('data-xsize')) * panel_perWidth);
          element.css({"left": e_left, "width": e_width});
          element.find('.draw-chart-wrapper').css({"width": e_width - 20});
          history_width = parseInt(element.width()) + 2;//加宽度
        });

        //拖动按钮与标志位与按钮触发
        var dragTrigger = element.find('.panel-heading'),
          dragFlag = false;
        dragTrigger.on('mousedown', function (event) {
          var flag = $(event.target).parents('.panel-action-bar');
          if (flag.length > 0) return;
          dragFlag = true;
        });

        dragTrigger.on('mouseup', function (event) {
          dragFlag = false;
        });
        //放大缩小按钮与标志位与按钮触发
        var resizeTrigger = element.find('.panel-resize'),
          resizeFlag = false;
        resizeTrigger.on('mousedown', function (event) {
          resizeFlag = true;
        });
        resizeTrigger.on('mouseup', function (event) {
          resizeFlag = false;
        });

        //初始化阴影
        var panel_shadow, dashBoardWidth, windowWidth, menuWidth, maxRight;
        //初始化拖动结果
        var history_x, history_y, destination_x, destination_y,
          history_width, history_height, final_width, final_height,
          start_x, start_y, count_x, count_y;//count为过程temp值

        //拖动与放大缩小
        element.on('mousedown', function (event) {
          if (dragFlag) {
            //初始值
            menuWidth = $(".ccas_leftNav").width() + $(".framework-product-navbar").width() + 25;
            $(element).parent().css({"user-select": "none"});
            dashBoardWidth = $(element).parent().width();
            maxRight = dashBoardWidth - parseInt(element.width());
            windowWidth = dashBoardWidth + menuWidth;
            history_x = parseInt(element.attr('data-x'));
            history_y = parseInt(element.attr('data-y'));
            start_x = Boolean(history_x) ? event.pageX - history_x : event.pageX;
            start_y = Boolean(history_y) ? event.pageY - history_y : event.pageY;
            //绑定拖动事件
            $(element).parent().on('mousemove', draging);
            element.on('mouseup', stopDraging);
            $(element).parent().on('mouseup', stopDraging);
            //初始化拖动阴影
            initPanelShadow();
          }
          if (resizeFlag) {
            //初始值
            history_width = parseInt(element.width()) + 2;//加宽度
            history_height = parseInt(element.height()) + 2;//加宽度
            start_x = event.pageX;
            start_y = event.pageY;
            //绑定拖动事件
            $(element).parent().on('mousemove', resizing);
            element.on('mouseup', stopResizing);
            $(element).parent().on('mouseup', stopResizing);
            //初始化拖动阴影
            initPanelShadow();
          }

          function draging(event) {

            //拖动的间距
            var y = Math.round(event.pageY - start_y);
            var x = Math.round(event.pageX - start_x);
            //设置拖动阴影
            setElementParameter(x, y);
            if (menuWidth > event.pageX || y < 0 || event.pageX > windowWidth) {
              stopDraging(event);
            }

          }


          function stopDraging(event) {
            $(element).parent().unbind('mousemove', draging);
            $(element).parent().unbind('mouseup', stopDraging);
            element.unbind('mousemove', draging);
            element.unbind('mouseup', stopDraging);
            dragFlag = false;
            element.css({"transition-duration": '.3s'});
            element.css({"left": destination_x, "top": destination_y});
            setTimeout(function () {
              element.css({"transition-duration": '0s'});
            }, 300);
            element.attr('data-x', destination_x).attr('data-y', destination_y)
              .attr('data-col', count_x).attr('data-row', count_y);
            panel_shadow.remove();
            var cur_item = {
              "id": parseInt(element.attr('data-id')),
              "col": count_x,
              "row": count_y,
              "xsize": parseInt(element.attr('data-xsize')),
              "ysize": parseInt(element.attr('data-ysize'))
            };
            utilService.updatePanelList(cur_item);
            panel_list = utilService.getOtherPanelList(parseInt(element.attr('data-id')));
            panel_list.push(cur_item);
            panel_list.pop();
          }

          function resizing(event) {
            //放大缩小的间距
            var y = Math.round(event.pageY - start_y);
            var x = Math.round(event.pageX - start_x);
            // if (!isStopResize(x, y)) {
            element.css({"width": history_width + x, "height": history_height + y});
            element.find('.draw-chart-wrapper').css({
              "width": history_width - 20,
              "height": history_height - 67
            });
            drawResizeShadow(x, y);
            // }
          }

          function stopResizing(event) {
            $(element).parent().unbind('mousemove', resizing);
            $(element).parent().unbind('mouseup', stopResizing);
            element.unbind('mouseup', stopResizing);
            resizeFlag = false;
            element.css({"transition-duration": '.3s'});
            element.css({"width": final_width, "height": final_height});
            element.find('.draw-chart-wrapper').css({
              "width": final_width - 20,
              "height": final_height - 67
            });
            setTimeout(function () {
              element.css({"transition-duration": '0s'});
            }, 300);
            element.attr('data-xsize', Math.round(final_width / panel_perWidth))
              .attr('data-ysize', Math.round(final_height / panel_perHeight));

            panel_shadow.remove();
            $rootScope.$broadcast('panelResizeChange', {
              "data-id": parseInt(element.attr('data-id')),
              "data-xsize": Math.round(final_width / panel_perWidth),
              "data-ysize": Math.round(final_height / panel_perHeight)
            });
            var cur_item = {
              "id": parseInt(element.attr('data-id')),
              "col": parseInt(element.attr('data-col')),
              "row": parseInt(element.attr('data-row')),
              "xsize": Math.round(final_width / panel_perWidth),
              "ysize": Math.round(final_height / panel_perHeight)
            };
            utilService.updatePanelList(cur_item);
            panel_list = utilService.getOtherPanelList(parseInt(element.attr('data-id')));
            panel_list.push(cur_item);
            panel_list.pop();
          }
        });

        function setElementParameter(x, y) {
          element.attr('data-x', x).attr('data-y', y);
          element.css({"left": x, "top": y});
          drawDragShadow(x, y);
        }


        //初始化拖动阴影
        var initPanelShadow = function () {
          $(element).parent().append("<div class='panel-shadow'></div>");
          panel_shadow = angular.element(document.querySelector('.panel-shadow'));
          panel_shadow.css({
            width: element.width() + 2,//加宽度
            height: element.height() + 2,//加宽度
            background: 'gray',
            position: 'absolute',
            top: parseInt(element.attr('data-y')),
            left: parseInt(element.attr('data-x'))
          });
        };
        //拖动设置阴影
        var drawDragShadow = function (x, y) {
          x = x < 0 ? 0 : (x > maxRight ? maxRight : x);
          y = y < 0 ? 0 : y;
          // getNewWidthHeight();
          count_x = Math.round(x / panel_perWidth);
          count_y = Math.round(y / panel_perHeight);
          destination_x = count_x * panel_perWidth;
          destination_y = count_y * panel_perHeight;
          var panelOffsetTop = parseInt(element.attr('data-ysize')) + count_y;
          // scope.$emit("panelOffsetTop", {
          //     'id': parseInt(element.attr('data-id')),
          //     'panelOffsetTop': panelOffsetTop
          // });
          panelOffset(parseInt(element.attr('data-id')), panelOffsetTop);

          panel_shadow.css({"left": destination_x, "top": destination_y});
        };

        var itemCount;

        function panelOffset(id, panelOffsetTop) {

          var otherMaxHeight = utilService.getMaxHeightById(id);
          var heightCount = otherMaxHeight >= panelOffsetTop ? otherMaxHeight : panelOffsetTop;
          if (itemCount != heightCount) {
            $(".layout-container").css({"height": (heightCount + 1) * panel_perHeight});
            itemCount = heightCount;
          }
        }


        //放大缩小设置阴影
        var drawResizeShadow = function (x, y) {
          // getNewWidthHeight();
          count_x = Math.round(x / panel_perWidth);
          count_y = Math.round(y / panel_perHeight);
          //判断放大缩小后是否小于最小单元格，并设置最终宽高
          var temp_width = history_width + count_x * panel_perWidth,
            temp_height = history_height + count_y * panel_perHeight;
          final_width = temp_width <= panel_perWidth ? panel_perWidth : temp_width;
          final_height = temp_height <= panel_perHeight ? panel_perHeight : temp_height;
          var panelOffsetTop = parseInt(element.attr('data-row')) + parseInt(element.attr('data-ysize')) + count_y;
          panelOffset(parseInt(element.attr('data-id')), panelOffsetTop);
          // scope.$emit("panelOffsetTop", panelOffsetTop);

          panel_shadow.css({"width": final_width, "height": final_height});
        };
      }
    }
  }]);
