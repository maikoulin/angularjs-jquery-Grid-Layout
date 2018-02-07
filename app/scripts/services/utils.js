angular.module("angularTestApp")

  .service("utils", function () {

      function sortLayoutItems(layout, compactType) {
        if (compactType === "horizontal") return sortLayoutItemsByColRow(layout);
        else return sortLayoutItemsByRowCol(layout);
      }

      function sortLayoutItemsByRowCol(layout) {
        return [].concat(layout).sort(function (a, b) {
          if (a.y > b.y || (a.y === b.y && a.x > b.x)) {
            return 1;
          } else if (a.y === b.y && a.x === b.x) {
            // Without this, we can get different sort results in IE vs. Chrome/FF
            return 0;
          }
          return -1;
        });
      }

      function sortLayoutItemsByColRow(layout) {
        return [].concat(layout).sort(function (a, b) {
          if (a.x > b.x || (a.x === b.x && a.y > b.y)) {
            return 1;
          }
          return -1;
        });
      }

      function getAllCollisions(layout, layoutItem) {
        return layout.filter(l => collides(l, layoutItem));
      }

      /**
       *
       * @param l1 LayoutItem
       * @param l2 LayoutItem
       * @returns {boolean}
       */
      function collides(l1, l2) {
        if (l1 === l2) return false; // same element
        if (l1.x + l1.w <= l2.x) return false; // l1 is left of l2
        if (l1.x >= l2.x + l2.w) return false; // l1 is right of l2
        if (l1.y + l1.h <= l2.y) return false; // l1 is above l2
        if (l1.y >= l2.y + l2.h) return false; // l1 is below l2
        return true; // boxes overlap
      }

      /**
       *
       * @param layout Layout
       * @param collidesWith LayoutItem
       * @param itemToMove LayoutItem
       * @param isUserAction
       * @param compactType
       * @param cols
       * @returns {Layout}
       */
      function moveElementAwayFromCollision(layout, collidesWith, itemToMove, isUserAction, compactType, cols) {
        const compactH = compactType === "horizontal";
        const compactV = compactType === "vertical";
        const preventCollision = false; // we're already colliding

        // If there is enough space above the collision to put this element, move it there.
        // We only do this on the main collision as this can get funky in cascades and cause
        // unwanted swapping behavior.
        if (isUserAction) {
          // Make a mock item so we don't modify the item here, only modify in moveElement.
          const fakeItem = {
            x: compactH ? Math.max(collidesWith.x - itemToMove.w, 0) : itemToMove.x,
            y: !compactH ? Math.max(collidesWith.y - itemToMove.h, 0) : itemToMove.y,
            w: itemToMove.w,
            h: itemToMove.h,
            i: "-1"
          };

          // This makes it feel a bit more precise by waiting to swap for just a bit when moving up.
          const [axis, dimension] =
            compactType === "horizontal" ? ["x", "w"] : ["y", "h"];
          const shouldSkip =
            false &&
            // Our collision is below the item to move, and only encroaches by 25% of its dimension; ignore
            (collidesWith[axis] > itemToMove[axis] &&
              collidesWith[axis] - itemToMove[axis] > itemToMove[dimension] / 4);

          // No collision? If so, we can go up there; otherwise, we'll end up moving down as normal
          if (!shouldSkip && !getFirstCollision(layout, fakeItem)) {
            console.log(
              `Doing reverse collision on ${itemToMove.i} up to [${fakeItem.x},${
                fakeItem.y
                }].`
            );
            return moveElement(
              layout,
              itemToMove,
              fakeItem.x,
              fakeItem.y,
              isUserAction,
              preventCollision,
              compactType,
              cols
            );
          }
        }
        return moveElement(
          layout,
          itemToMove,
          compactH ? collidesWith.x + collidesWith.w : itemToMove.x,
          compactV ? collidesWith.y + collidesWith.h : itemToMove.y,
          isUserAction,
          preventCollision,
          compactType,
          cols
        );

      }


      /**
       *
       * @param layout  Layout
       * @param l   LayoutItem
       * @param x
       * @param y
       * @param isUserAction
       * @param preventCollision
       * @param compactType
       * @param cols
       * @returns {Layout}
       */
      function moveElement(layout, l, x, y, isUserAction, preventCollision, compactType, cols) {
        if (l.static) return layout;
        // console.log(`Moving element ${l.i} to [${x},${y}] from [${l.x},${l.y}]`);

        // Short-circuit if nothing to do.
        if (l.y === y && l.x === x) return layout;

        const oldX = l.x;
        const oldY = l.y;

        // This is quite a bit faster than extending the object
        l.x = x;
        l.y = y;
        l.moved = true;

        // If this collides with anything, move it.
        // When doing this comparison, we have to sort the items we compare with
        // to ensure, in the case of multiple collisions, that we're getting the
        // nearest collision.
        let sorted = sortLayoutItems(layout, compactType);
        const movingUp =
          compactType === "vertical"
            ? oldY >= y
            : compactType === "horizontal" ? oldX >= x : false;
        if (movingUp) sorted = sorted.reverse();
        const collisions = getAllCollisions(sorted, l);

        // There was a collision; abort
        if (preventCollision && collisions.length) {
          // console.log(`Collision prevented on ${l.i}, reverting.`);
          l.x = oldX;
          l.y = oldY;
          l.moved = false;
          return layout;
        }

        // Move each item that collides away from this element.
        for (let i = 0, len = collisions.length; i < len; i++) {
          const collision = collisions[i];
          // console.log(
          //   `Resolving collision between ${l.i} at [${l.x},${l.y}] and ${
          //     collision.i
          //     } at [${collision.x},${collision.y}]`
          // );

          // Short circuit so we can't infinite loop
          if (collision.moved) continue;

          // Don't move static items - we have to move *this* element away
          if (collision.static) {
            layout = moveElementAwayFromCollision(
              layout,
              collision,
              l,
              isUserAction,
              compactType,
              cols
            );
          } else {
            layout = moveElementAwayFromCollision(
              layout,
              l,
              collision,
              isUserAction,
              compactType,
              cols
            );
          }
        }

        return layout;
      }


      /**
       *
       * @param layout
       * @param compactType
       * @param cols
       * @returns {Layout}
       */
      function compact(layout, compactType, cols) {
        // Statics go in the compareWith array right away so items flow around them.
        const compareWith = getStatics(layout);
        // We go through the items by row and column.
        const sorted = sortLayoutItems(layout, compactType);
        // Holding for new items.
        const out = Array(layout.length);

        for (let i = 0, len = sorted.length; i < len; i++) {
          let l = cloneLayoutItem(sorted[i]);

          // Don't move static elements
          if (!l.static) {
            l = compactItem(compareWith, l, compactType, cols, sorted);

            // Add to comparison array. We only collide with items before this one.
            // Statics are already in this array.
            compareWith.push(l);
          }

          // Add to output array to make sure they still come out in the right order.
          out[layout.indexOf(sorted[i])] = l;

          // Clear moved flag, if it exists.
          l.moved = false;
        }

        return out;
      }


      function cloneLayoutItem(layoutItem) {
        return angular.copy(layoutItem)
      }

      /**
       *
       * @param compareWith  Layout
       * @param l   LayoutItem
       * @param compactType
       * @param cols
       * @param fullLayout  Layout
       * @returns {LayoutItem}
       */
      function compactItem(compareWith, l, compactType, cols, fullLayout) {
        const compactV = compactType === "vertical";
        const compactH = compactType === "horizontal";
        if (compactV) {
          // Bottom 'y' possible is the bottom of the layout.
          // This allows you to do nice stuff like specify {y: Infinity}
          // This is here because the layout must be sorted in order to get the correct bottom `y`.
          l.y = Math.min(bottom(compareWith), l.y);
          // Move the element up as far as it can go without colliding.
          while (l.y > 0 && !getFirstCollision(compareWith, l)) {
            l.y--;
          }
        } else if (compactH) {
          l.y = Math.min(bottom(compareWith), l.y);
          // Move the element left as far as it can go without colliding.
          while (l.x > 0 && !getFirstCollision(compareWith, l)) {
            l.x--;
          }
        }

        // Move it down, and keep moving it down if it's colliding.
        let collides;
        while ((collides = getFirstCollision(compareWith, l))) {
          if (compactH) {
            resolveCompactionCollision(fullLayout, l, collides.x + collides.w, "x");
          } else {
            resolveCompactionCollision(fullLayout, l, collides.y + collides.h, "y");
          }
          // Since we can't grow without bounds horizontally, if we've overflown, let's move it down and try again.
          if (compactH && l.x + l.w > cols) {
            l.x = cols - l.w;
            l.y++;
          }
        }
        return l;
      }


      function bottom(layout) {
        let max = 0,
          bottomY;
        for (let i = 0, len = layout.length; i < len; i++) {
          bottomY = layout[i].y + layout[i].h;
          if (bottomY > max) max = bottomY;
        }
        return max;
      }

      /**
       *
       * @param layout
       * @param layoutItem
       * @returns {LayoutItem}
       */
      function getFirstCollision(layout,
                                 layoutItem) {
        for (let i = 0, len = layout.length; i < len; i++) {
          if (collides(layout[i], layoutItem)) return layout[i];
        }
      }


      const heightWidth = {x: "w", y: "h"};


      /**
       *
       * @param layout
       * @param item  LayoutItem
       * @param moveToCoord
       * @param axis  "x" | "y"
       */
      function resolveCompactionCollision(layout,
                                          item,
                                          moveToCoord,
                                          axis) {
        const sizeProp = heightWidth[axis];
        item[axis] += 1;
        const itemIndex = layout.indexOf(item);

        // Go through each item we collide with.
        for (let i = itemIndex + 1; i < layout.length; i++) {
          const otherItem = layout[i];

          // Ignore static items
          if (otherItem.static) continue;

          if (collides(item, otherItem)) {
            resolveCompactionCollision(
              layout,
              otherItem,
              moveToCoord + item[sizeProp],
              axis
            );
          }
        }

        item[axis] = moveToCoord;
      }

      function getLayoutItem(layout, id) {
        for (let i = 0, len = layout.length; i < len; i++) {
          if (layout[i].i === id) return layout[i];
        }
      }


      /**
       *
       * @param initialLayout  Layout
       * @param cols
       * @param compactType
       * @returns {Array}
       */

      function synchronizeLayoutWithChildren(initialLayout,
                                             cols,
                                             compactType) {
        initialLayout = initialLayout || [];

        // Generate one layout item per child.
        let layout  = angular.copy(initialLayout);

        // Correct the layout.
        layout = correctBounds(layout, {cols: cols});
        layout = compact(layout, compactType, cols);

        return layout;
      }


      /**
       *
       * @param layout Layout
       * @param bounds {{cols: *}}
       * @returns {Layout}
       */
      function correctBounds(layout,
                             bounds) {
        const collidesWith = getStatics(layout);
        for (let i = 0, len = layout.length; i < len; i++) {
          const l = layout[i];
          // Overflows right
          if (l.x + l.w > bounds.cols) l.x = bounds.cols - l.w;
          // Overflows left
          if (l.x < 0) {
            l.x = 0;
            l.w = bounds.cols;
          }
          if (!l.static) collidesWith.push(l);
          else {
            // If this is static and collides with other statics, we must move it down.
            // We have to do something nicer than just letting them overlap.
            while (getFirstCollision(collidesWith, l)) {
              l.y++;
            }
          }
        }
        return layout;
      }

      function getStatics(layout) {
        return layout.filter(l => l.static);
      }

    function compactType(props) {
      return props.verticalCompact === false ? null : props.compactType;
    }

      return {
        getLayoutItem: getLayoutItem,
        cloneLayoutItem: cloneLayoutItem,
        synchronizeLayoutWithChildren: synchronizeLayoutWithChildren,
        moveElement: moveElement,
        compact: compact,
        bottom: bottom,
        getFirstCollision: getFirstCollision,
        compactType:compactType


      }


    }
  );
