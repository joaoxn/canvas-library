import {
    init, getWrapper, Shape, Vector, Box, Style, UIElement, HTMLDisplayElement, Movable
} from "./canvas-library.js";

init("#game", false, true);

const canvas = getWrapper().canvas;
const ctx = getWrapper().ctx;
const GRAVITY = 0.6;
let frozen = false;

let score = 0;

const scoreDisplay = HTMLDisplayElement.allFromHTML(`
        <div id="display" style="width: fit-content;">
            <h2 style="width: fit-content;">Score: 000000</h2>
        </div>
    `).children[0];

console.log(scoreDisplay.element.getBoundingClientRect());

scoreDisplay.x = canvas.width - scoreDisplay.width - 20;
scoreDisplay.element.style.cssText += `
    padding: 10px;
    background-color: #000000ff;
    border-bottom-left-radius: 10px;
`

// scoreDisplay.y = 0;

const scoreText = scoreDisplay.children[0];

function createEndScreen() {
    // Dynamically create from HTML code
    const created = HTMLDisplayElement.allFromHTML(`
        <div>
            <h1>Game Over</h1>
            <h2>Failed loading your score :(</h2>
            <h3>Press R to replay</h3>
            <button id="restart" style="margin-top: 50px; background-color: #113;">Restart</button>
        </div>
    `)

    const div = created.getChildrenByTag('div')[0];
    console.log(created);

    // Set elements' position and size relative to the canvas
    div.width = canvas.width;
    div.height = canvas.height;

    // Set elements' style based on CSS properties
    div.element.style.cssText += `
        display: flex; 
        flex-direction: column; 
        align-items: center; 
        justify-content: center;
        background-color: #00000088;
    `
    document.addEventListener('keyup', (event) => {
        if (event.key.toLowerCase() === 'r')
            location.reload();
    });

    div.getChildrenByTag('h2')[0].element.textContent = `Your score: ${score}`;

    const button = div.getChildById("restart")!;
    button.width = 100;
    button.height = 50;
    button.element.addEventListener('click', () => location.reload());
}



UIElement.addListeners();

const player = new Movable(25, (canvas.height - 30) * 30 / 100, 50, 30);
player.acceleration.y = GRAVITY;
player.deleteIfOutOfBounds = false;

player.keydownCallback = (event) => {
    const jumpKeys = [' ', 'ArrowUp', 'W'];
    if (jumpKeys.includes(event.key)) {
        player.velocity.y = -8;
    }
}

player.collisionCallback = (player, other) => {
    frozen = true;
    createEndScreen();
}


const floor = new Movable(0, canvas.height - 10, canvas.width, 10);
floor.clickCallback = () => {
    console.log("Clicked!")
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
        if (i % 5 == 0) score = i;
        scoreText.element.textContent = "Score: "+ score.toString().padStart(6, '0');
        
        Movable.tickAll();
        if (i % 60 == 0) {
            const gapHeight = 150;
            let yGap = Math.random() * (canvas.height - gapHeight + 1)
            newPipes(gapHeight, yGap);
        }
    }

    i++;
    requestAnimationFrame(loop);
}

loop();
