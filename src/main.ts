const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

interface Shape {
    x: number;
    y: number;
    hit(point: Vector): boolean;
}

class Vector {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    add(vector: Vector) {
        this.x += vector.x;
        this.y += vector.y;
        return this;
    }

    scale(scalar: number) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    insideCanvas(): boolean {
        return Box.fromHTML(canvas).hit(new Vector(this.x, this.y))
    }

    static add(vector1: Vector, vector2: Vector) {
        return new Vector(vector1.x + vector2.x, vector1.y + vector2.y);
    }

    static zero() {
        return new Vector(0, 0);
    }
    static one() {
        return new Vector(1, 1);
    }
    static x() {
        return new Vector(1, 0);
    }
    static y() {
        return new Vector(0, 1);
    }
}

class Box implements Shape {
    x: number;
    y: number;
    width: number;
    height: number;

    constructor(x: number, y: number, width: number, height: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    /**
     * Creates a new Box instance from an HTML element.
     * The Box's position and dimensions are calculated based on the element's position relative to the canvas.
     *
     * @param element - The HTML element to create the Box from.
     * @returns A new Box instance representing the position and dimensions of the HTML element relative to the canvas.
     */
    static fromHTML(element: HTMLElement) {
        const canvasRect = canvas.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();

        return new Box(elementRect.x - canvasRect.x, elementRect.y - canvasRect.y, 
            elementRect.width, elementRect.height);
    }


    hit(point: Vector): boolean {
        return point.x >= this.x && point.x <= this.x + this.width
            && point.y >= this.y && point.y <= this.y + this.height;
    }

    
    /**
     * Determines if this box is completely inside, completely outside, or intersects with another box.
     *
     * @param box - The box to check against.
     * @param inclusive - If true, the function considers the bounding box of the box.
     *                           If false, the function considers the area inside the box (exclusive).
     *                           Default value is false.
     *
     * @returns 1 if this box is completely inside the given box, -1 if it is completely outside, and 0 if it intersects.
     */
    inside(box: Box, inclusive: boolean = false): number {
        const compare = (a: number, b: number, isInclusive: boolean) => isInclusive ? a >= b : a > b;
        const compareOpposite = (a: number, b: number, isInclusive: boolean) => isInclusive ? a <= b : a < b;
    
        const leftInside = compare(this.x, box.x, inclusive);
        const rightInside = compareOpposite(this.x + this.width, box.x + box.width, inclusive);
        const topInside = compare(this.y, box.y, inclusive);
        const bottomInside = compareOpposite(this.y + this.height, box.y + box.height, inclusive);
    
        if (leftInside && rightInside && topInside && bottomInside) return 1;
    
        const leftOutside = compareOpposite(this.x + this.width, box.x, inclusive);
        const rightOutside = compare(this.x, box.x + box.width, inclusive);
        const topOutside = compareOpposite(this.y + this.height, box.y, inclusive);
        const bottomOutside = compare(this.y, box.y + box.height, inclusive);
    
        if (leftOutside || rightOutside || topOutside || bottomOutside) return -1;
    
        return 0;
    }    

    /**
     * Determines if this box is completely inside, completely outside, or intersects with the canvas.
     *
     * @returns 1 if this box is completely inside the canvas, -1 if it is completely outside, and 0 if it intersects.
     */
    insideCanvas(): number {
        return this.inside(Box.fromHTML(canvas));
    }
}

class Style {
    background: string | CanvasGradient | CanvasPattern = "white";
    fontSize?: number;
    fontFamily: string = "sans-serif";
    text?: string;
    textColor: string = "black";
}

class UIElement extends Box {
    style: Style;
    clickCallback?: (event: MouseEvent) => void;
    keydownCallback?: (event: KeyboardEvent) => void;

    static elements: UIElement[] = [];

    constructor(x: number, y: number, width: number, height: number, style: Style = new Style()) {
        super(x, y, width, height);
        this.style = style;

        UIElement.elements.push(this);
        console.log(this, "was ADDED to the list of drawed elements")
    }

    draw() {
        ctx.fillStyle = this.style.background;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        ctx.fillStyle = this.style.textColor;

        if (this.style.text) {
            const fontSize = this.style.fontSize ?? this.height;
            ctx.font = fontSize + "px " + this.style.fontFamily;
            const sizeDiff = this.height - fontSize

            ctx.fillText(this.style.text, this.x, this.y + this.height - sizeDiff / 2, this.width);
        }
        // TODO: Implement more style features to the drawing
    }

    static drawAll() {
        for (const element of this.elements)
            element.draw();
    }

    /**
     * A static method that returns a callback function to handle click events.
     * This callback function invokes the clickCallback of every box that the mouse hits with such callback defined.
     *
     * @returns {(event: MouseEvent) => void} - A callback function that handles click events.
     */
    static getClickCallback() {
        return (event: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const position = new Vector(event.x - rect.x, event.y - rect.y);

            if (!position.insideCanvas()) return;


            for (const element of this.elements)
                if (element.hit(position) && element.clickCallback)
                    element.clickCallback(event);
        }
    }

    /**
     * A static method that returns a callback function to handle keydown events.
     * This callback function iterates through all UIElement instances and invokes their keydownCallback if defined.
     *
     * @returns {(event: KeyboardEvent) => void} - A callback function that handles keydown events.
     */
    static getKeydownCallback() {
        return (event: KeyboardEvent) => {
            for (const element of this.elements)
                if (element.keydownCallback)
                    element.keydownCallback(event);
        }
    }


    static addListeners() {
        document.addEventListener('click', this.getClickCallback());
        document.addEventListener('keydown', this.getKeydownCallback());
    }

    static removeListeners() {
        document.removeEventListener('click', this.getClickCallback());
        document.removeEventListener('keydown', this.getKeydownCallback());
    }
}

class Movable extends UIElement {
    velocity: Vector = Vector.zero();
    acceleration: Vector = Vector.zero();
    tickCallback?: (movable: Movable) => void;

    deleteIfOutOfBounds = false;
    collisionGroup: string | null = "default";
    collisionCallback?: (movable: Movable, other: Movable) => void;

    static elements: Movable[] = [];

    constructor(x: number, y: number, width: number, height: number, style?: Style) {
        super(x, y, width, height, style);

        Movable.elements.push(this);
    }

    delete() {
        const classes = [UIElement, Movable];

        for (const staticClass of classes) {
            const idx = staticClass.elements.indexOf(this);
            staticClass.elements.splice(idx, 1);
        }
        console.log(this, "was REMOVED from context")
    }

    collided(): Movable[] {
        const collidedElements: Movable[] = [];
        for (const other of Movable.elements) {
            if (this !== other
                && this.collisionGroup === other.collisionGroup
                && this.inside(other) !== -1)
                collidedElements.push(other);
        }
        return collidedElements;
    }

    tick() {
        if (this.deleteIfOutOfBounds && this.insideCanvas() == -1) {
            this.delete();
            return;
        }

        if (this.collisionCallback) {
            const collidedElements = this.collided();

            for (const other of collidedElements) {
                this.collisionCallback(this, other);
                if (other.collisionCallback)
                    other.collisionCallback(other, this);
            }
        }

        if (this.tickCallback)
            this.tickCallback(this);

        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.velocity.add(this.acceleration);
    }

    static tick() {
        for (const element of this.elements)
            element.tick();
    }
}

UIElement.addListeners();

const square = new Movable(10, canvas.height - 100, 100, 100);

square.keydownCallback = (event) => {
    if (event.key !== ' ' || square.acceleration.y !== 0) return;
    square.velocity.y = -20;
    square.acceleration.y = 1;
}

square.tickCallback = (movable) => {
    if (movable.y + movable.height <= canvas.height) return

    movable.y = canvas.height - movable.height;
    movable.velocity.y = 0;
    movable.acceleration.y = 0;
}

let frozen = false;

class Obstacle extends Movable {
    velocity = new Vector(-10, 0);
    deleteIfOutOfBounds = true;

    static defaultStyle = new Style();

    static {
        this.defaultStyle.background = "red";
    }

    constructor(width: number, height: number, style?: Style) {
        style = style ?? Obstacle.defaultStyle;
        super(canvas.width, canvas.height - height, width, height, style);
    }

    collisionCallback = (element: Movable, other: Movable) => {
        if (other !== square) return;
        frozen = true;
    }
}

let reloadListener = document.addEventListener('keydown', (event) => {
    if (frozen && event.key === ' ' || event.key === 'r') {
        location.reload();
    }
})

let i = 0;
function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);


    UIElement.drawAll();
    if (!frozen) {
        Movable.tick();
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
