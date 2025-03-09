# TO-DO List

## Features

- Vector.equal(Vector) method
- Custom event callbacks: Let user define functions for all wanted events. Event listeners are added dynamically.
- Document callbacks to warn the order of execution
- Delta-time and tick loading non-dependant on fps

## Incomplete implementations
- Delete method for UIElements
- Line 274: missing ; in the delete method of Movable
- Remove logs from library

## Bug Fixes
- Change collisionCallback caller from Movable.tick() to always check, because even if `this.collisionCallback` is undefined, the other collided movable might have a callback
- Deleted property for elements with delete() method
- Fix tickAll skipping a Movable when one is deleted
