# TO-DO List

## Features

- Custom event callbacks: Let user define functions for all wanted events. Event listeners are added dynamically;
- Delta-time and tick loading non-dependant on fps;
- Tickable interface for any time-based class;
- Tween support for boxes or UIElements (Util class);
- Vector.normalize() method;
- Dot product for Vector class;
- HTMLDisplayElement class for HTML elements positioned inside the canvas;

## Incomplete implementations
- Remove "MapMusic" reference from the whole project (Former project name);

## Bug Fixes

## DONE
- Library logs disabled by default. Pass `true` as `enableLogs` parameter in init(...) to enable logging;
- Added ; to the end of all valid lines in `canvas-library.ts`;
- Delete method for UIElements;
- Deleted property for elements with delete() method;
- Fixed tickAll skipping a Movable when one is deleted;
- Change collisionCallback caller from Movable.tick() to always check, because even if `this.collisionCallback` is undefined, the other collided movable might have a callback;
- Vector.equals(Vector) method;
- Document callbacks to warn the order of execution;
