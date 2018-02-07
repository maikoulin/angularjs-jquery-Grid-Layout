angular.module("angularTestApp")

  .directive("gridLayout", ["$timeout", "$window", "$rootScope", "utilService", function ($timeout, $window, $rootScope, utilService) {
    return {
      restrict: "AE",
      scope: {},
      controller: ["$scope", function ($scope) {
      }],
      link: function (scope, element, attrs) {
        element.attr('data-per-width', parseInt(element.width() / 12));
        var timeout;
        $(window).on("resize.doResize", function () {
          scope.$apply(setPerWidth);
        });

        function setPerWidth() {
          if (timeout) $timeout.cancel(timeout);
          timeout = $timeout(function () {
            element.attr('data-per-width', parseInt(element.width() / 12));
            $rootScope.$broadcast("data-per-width-change")
          }, 300);
        }

        function setHeight() {
          var body_height = $window.innerHeight;
          element.css({"min-height": body_height});
        }

        scope.$watch(function () {
          return $window.innerHeight;
        }, function () {
          setHeight();
        });
      }


    }
  }
  ]);
