const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

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
        const rect = canvas.getBoundingClientRect();
        const rectBox = new Box(rect.x, rect.y, rect.width, rect.height);
        return rectBox.hit(new Vector(this.x, this.y))
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

class Box {
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

    hit(point: Vector): boolean {
        return point.x >= this.x && point.x <= this.x + this.width
            && point.y >= this.y && point.y <= this.y + this.height;
    }

    inside(box: Box): number {
        {
            const left = this.x >= box.x;
            const right = this.x + this.width <= box.x + box.width;
            const top = this.y >= box.y;
            const bottom = this.y + this.height <= box.y + box.height;

            if (left && right && top && bottom)
                return 1;
        }

        {
            const left = this.x + this.width <= box.x;
            const right = this.x >= box.x + box.width;
            const top = this.y + this.height <= box.y;
            const bottom = this.y >= box.y + box.height;

            if (left && right && top && bottom)
                return -1;
        }

        return 0;
    }

    insideCanvas(): number {
        const rect = canvas.getBoundingClientRect();
        const rectBox = new Box(rect.x, rect.y, rect.width, rect.height);
        return this.inside(rectBox);
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

    static elements: UIElement[] = [];

    constructor(x: number, y: number, width: number, height: number, style?: Style) {
        super(x, y, width, height);
        this.style = style ?? new Style();

        UIElement.elements.push(this);
        console.log(this, "was added to the list of drawed elements")
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
}

class Clickable extends UIElement {
    callbackfn: (event: MouseEvent) => void;

    static elements: Clickable[] = [];

    constructor(x: number, y: number, width: number, height: number, callbackfn: (event: MouseEvent) => void, style?: Style) {
        super(x, y, width, height, style);
        this.callbackfn = callbackfn;

        Clickable.elements.push(this);
    }

    static addListener() {
        document.addEventListener('click', (event) => {
            const rect = canvas.getBoundingClientRect();

            if (!new Vector(event.x, event.y).insideCanvas()) return;

            const position = new Vector(event.x - rect.x, event.y - rect.y);

            for (const element of this.elements)
                if (element.hit(position))
                    element.callbackfn(event);
        })
    }
}

class Movable extends UIElement {
    velocity: Vector;
    acceleration: Vector;
    tickCallback?: (movable: Movable) => void;

    deleteIfOutOfBounds = false;
    collisionGroup?: string;

    static elements: Movable[] = [];

    constructor(x: number, y: number, width: number, height: number, velocity?: Vector, acceleration?: Vector, style?: Style) {
        super(x, y, width, height, style);
        this.velocity = velocity ?? Vector.zero();
        this.acceleration = acceleration ?? Vector.zero();

        Movable.elements.push(this);
    }

    delete() {
        const classes = [UIElement, Movable];

        for (const staticClass of classes) {
            const idx = staticClass.elements.indexOf(this);
            staticClass.elements.splice(idx, 1);
        }
    }

    static tick() {
        for (const element of this.elements) {
            if (element.deleteIfOutOfBounds && element.insideCanvas() == -1) {
                element.delete();
                continue;
            }

            if (element.tickCallback)
                element.tickCallback(element);
            element.x += element.velocity.x;
            element.y += element.velocity.y;
            element.velocity.add(element.acceleration);
        }
    }
}

Clickable.addListener();

const square = new Movable(10, 10, 100, 100);
square.velocity = Vector.one().scale(5);

square.tickCallback = (movable: Movable) => {
    if (movable.x <= 0 || movable.x + movable.width >= canvas.width)
        movable.velocity.x = -movable.velocity.x

    if (movable.y <= 0 || movable.y + movable.height >= canvas.height)
        movable.velocity.y = -movable.velocity.y
}

// const button = new Clickable(canvas.width/2-100, canvas.height/2-50, 200, 100, (event) => console.log(event));
// button.style.background = "#964B00";
// button.style.text = "Play"
// button.style.fontSize = 34;

function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    UIElement.drawAll();
    Movable.tick();

    requestAnimationFrame(loop);
}

loop();
