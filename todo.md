# TO-DO List

## Features

- Custom event callbacks: Let user define functions for all wanted events. Event listeners are added dynamically.;
- Document callbacks to warn the order of execution;
- Delta-time and tick loading non-dependant on fps;

## Incomplete implementations

## Bug Fixes

## DONE
- Library logs disabled by default. Pass `true` as `enableLogs` parameter in init(...) to enable logging;
- Added ; to the end of all valid lines in `canvas-library.ts`;
- Delete method for UIElements;
- Deleted property for elements with delete() method;
- Fixed tickAll skipping a Movable when one is deleted;
- Change collisionCallback caller from Movable.tick() to always check, because even if `this.collisionCallback` is undefined, the other collided movable might have a callback;
- Vector.equals(Vector) method;
