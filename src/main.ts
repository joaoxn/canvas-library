import { 
    init, getWrapper, Shape, Vector, Box, Style, UIElement, HTMLDisplayElement, Movable 
} from "./canvas-library.js";

init("#game", false, true);

const canvas = getWrapper().canvas;
const ctx = getWrapper().ctx;
const GRAVITY = 0.6;

let frozen = false;

const created = HTMLDisplayElement.allFromHTML(`
        <div>
            <h1>Game Over</h1>
            <h2>Your Score: 0</h2>
            <button id="restart" style="margin-top: 50px; background-color: black;">Restart</button>
        </div>
    `)

const div = created.at(0)!;

// Set elements' position and size relative to the canvas
div.width = canvas.width;
div.height = canvas.height;

// Set elements' style based on CSS properties
div.element.style.cssText += `
    display: flex; 
    flex-direction: column; 
    align-items: center; 
    justify-content: center;
`

console.log(created);
const button = created.at(0)?.getChildById("restart")!;
button.width = 100;
button.height = 50;

// const div = new HTMLDisplayElement("div");
// div.x = 0;
// div.y = 0;
// div.width = canvas.width;
// div.height = canvas.height;
// div.element.style.cssText += `
//     display: flex;
//     flex-direction: column;
//     align-items: center;
//     justify-content: center;
// `;

// const gameover = new HTMLDisplayElement("h1", div);
// gameover.element.innerText = "Game Over";

// const score = new HTMLDisplayElement("h2", div);
// score.element.innerText = "0 Points";

// const restart = new HTMLDisplayElement("button", div);
// restart.width = 100;
// restart.height = 50;
// restart.element.style.marginTop = "50px";

UIElement.addListeners();

const player = new Movable(25, (canvas.height - 30)*30/100, 50, 30);
player.acceleration.y = GRAVITY;
player.deleteIfOutOfBounds = false;

const floor = new Movable(0, canvas.height-10, canvas.width, 10);
floor.clickCallback = () => {
    console.log("Clicked!")
}

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
        const velocity = -5;
        const x = canvas.width + velocity;
        const y = onTop ? 0 : canvas.height - height;
        const width = 50;
        super(x, y, width, height);

        this.velocity.x = velocity;
        this.deleteIfOutOfBounds = true;
    }

    tickCallback = (pipe: Movable) => {
        // console.log(pipe);
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
            newPipes(gapHeight, yGap);
        }
    }

    if (frozen) {
        // TODO Game Over
    }

    i++;
    requestAnimationFrame(loop);
}

loop();
