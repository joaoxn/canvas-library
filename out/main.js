import { initializeCanvas, getWrapper, Vector, Style, UIElement, Movable } from "./canvas-library.js";
initializeCanvas("#game");
const canvas = getWrapper().canvas;
const ctx = getWrapper().ctx;
UIElement.addListeners();
const square = new Movable(20, getWrapper().canvas.height - 100, 100, 100);
square.keydownCallback = (event) => {
    if (event.key !== ' ' || square.acceleration.y !== 0)
        return;
    square.velocity.y = -20;
    square.acceleration.y = 1;
};
square.tickCallback = (movable) => {
    if (movable.y + movable.height <= canvas.height)
        return;
    movable.y = canvas.height - movable.height;
    movable.velocity.y = 0;
    movable.acceleration.y = 0;
};
let frozen = false;
class Obstacle extends Movable {
    velocity = new Vector(-10, 0);
    deleteIfOutOfBounds = true;
    static defaultStyle = new Style();
    static {
        this.defaultStyle.background = "red";
    }
    constructor(width, height, style) {
        style = style ?? Obstacle.defaultStyle;
        super(canvas.width, canvas.height - height, width, height, style);
    }
    collisionCallback = (element, other) => {
        if (other !== square)
            return;
        frozen = true;
    };
}
let reloadListener = document.addEventListener('keydown', (event) => {
    if (frozen && event.key === ' ' || event.key === 'r') {
        location.reload();
    }
});
let i = 0;
function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    UIElement.drawAll();
    if (!frozen) {
        Movable.tickAll();
        if (i % 50 == 0)
            new Obstacle(50, 80);
    }
    if (frozen) {
        ctx.fillStyle = "#bbbbbb88";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "60px Arial";
        ctx.fillText("Game Over", canvas.width / 2 - 150, canvas.height / 2);
        ctx.font = "30px Arial";
        ctx.fillText("Press R or Space to Restart", canvas.width / 2 - 200, canvas.height / 2 + 100);
    }
    i++;
    requestAnimationFrame(loop);
}
loop();
//# sourceMappingURL=main.js.map