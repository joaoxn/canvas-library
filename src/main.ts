import { 
    init, getWrapper, Shape, Vector, Box, Style, UIElement, Movable 
} from "./canvas-library.js";

init("#game");

const canvas = getWrapper().canvas;
const ctx = getWrapper().ctx;
const GRAVITY = 0.6;

let frozen = false;

UIElement.addListeners();

const player = new Movable(25, (canvas.height - 30)*30/100, 50, 30);
player.acceleration.y = GRAVITY;
player.deleteIfOutOfBounds = false;

const floor = new Movable(0, canvas.height-10, canvas.width, 10);

player.keydownCallback = (event) => {
    const jumpKeys = [' ', 'ArrowUp', 'W'];
    if (jumpKeys.includes(event.key)) {
        player.velocity.y = -8;
    }
}

player.collisionCallback = (player, other) => {
    frozen = true;
}

class Pipe extends Movable {
    constructor(onTop: boolean, height: number) {
        const x = canvas.width;
        const y = onTop ? 0 : canvas.height - height;
        const width = 50;
        super(x, y, width, height);

        this.velocity.x = -5;
        this.deleteIfOutOfBounds = true;
    }

    tickCallback = (pipe: Movable) => {
        console.log(pipe);
    }
}

function newPipes(gapHeight: number, yGap: number): [Pipe, Pipe] {
    const topPipe = new Pipe(true, yGap);
    const bottomPipe = new Pipe(false, canvas.height - (gapHeight + yGap));
    return [topPipe, bottomPipe];
}

let i = 0;
function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    UIElement.drawAll();
    if (!frozen) {
        Movable.tickAll();
        if (i % 60 == 0) {
            const gapHeight = 150;
            let yGap = Math.random() * (canvas.height - gapHeight + 1)
            newPipes(gapHeight, yGap)
        }
    }

    if (frozen) {
        // TODO Game Over
    }

    i++;
    requestAnimationFrame(loop);
}

loop();
