export { init, getWrapper, Vector, Box, Style, UIElement, Movable };
class CanvasWrapper {
    canvas;
    ctx;
    logsEnabled;
    constructor(canvasOrSelector, logsEnabled) {
        const canvas = typeof canvasOrSelector !== 'string' ?
            canvasOrSelector : document.querySelector(canvasOrSelector);
        if (!canvas || !(canvas instanceof HTMLCanvasElement))
            throw new Error("Canvas element not found. Given querySelector may be incorrect or a canvas with such selector does not exist.");
        this.canvas = canvas;
        const ctx = this.canvas.getContext('2d');
        if (!ctx)
            throw new Error("Failed to get 2D context. Canvas may not be supported or is not attached to the DOM.");
        this.ctx = ctx;
        this.logsEnabled = logsEnabled;
    }
}
let canvasWrapper;
function getWrapper() {
    if (!canvasWrapper)
        throw new Error("canvasWrapper was not initialized. Please call init(...) before using the library.");
    return canvasWrapper;
}
function init(canvasOrSelector, enableLogs = false) {
    canvasWrapper = new CanvasWrapper(canvasOrSelector, enableLogs);
}
function log(...message) {
    if (!getWrapper().logsEnabled)
        return false;
    console.log(message);
    return true;
}
class Vector {
    x;
    y;
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    add(vector) {
        this.x += vector.x;
        this.y += vector.y;
        return this;
    }
    scale(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }
    equals(vector) {
        return this.x === vector.x && this.y === vector.y;
    }
    insideCanvas() {
        return Box.fromHTML(getWrapper().canvas)
            .hit(new Vector(this.x, this.y));
    }
    static add(vector1, vector2) {
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
    x;
    y;
    width;
    height;
    constructor(x, y, width, height) {
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
    static fromHTML(element) {
        const canvasRect = getWrapper().canvas.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        return new Box(elementRect.x - canvasRect.x, elementRect.y - canvasRect.y, elementRect.width, elementRect.height);
    }
    hit(point) {
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
    inside(box, inclusive = true) {
        const compare = (a, b, isInclusive) => isInclusive ? a >= b : a > b;
        const compareOpposite = (a, b, isInclusive) => isInclusive ? a <= b : a < b;
        const leftInside = compare(this.x, box.x, inclusive);
        const rightInside = compareOpposite(this.x + this.width, box.x + box.width, inclusive);
        const topInside = compare(this.y, box.y, inclusive);
        const bottomInside = compareOpposite(this.y + this.height, box.y + box.height, inclusive);
        if (leftInside && rightInside && topInside && bottomInside)
            return 1;
        const leftOutside = compareOpposite(this.x + this.width, box.x, inclusive);
        const rightOutside = compare(this.x, box.x + box.width, inclusive);
        const topOutside = compareOpposite(this.y + this.height, box.y, inclusive);
        const bottomOutside = compare(this.y, box.y + box.height, inclusive);
        if (leftOutside || rightOutside || topOutside || bottomOutside)
            return -1;
        return 0;
    }
    /**
     * Determines if this box is completely inside, completely outside, or intersects with the canvas.
     *
     * @returns 1 if this box is completely inside the canvas, -1 if it is completely outside, and 0 if it intersects.
     */
    insideCanvas(inclusive) {
        return this.inside(Box.fromHTML(getWrapper().canvas), inclusive);
    }
}
class Style {
    background = "white";
    fontSize;
    fontFamily = "sans-serif";
    text;
    textColor = "black";
}
class UIElement extends Box {
    style;
    clickCallback;
    keydownCallback;
    deleted = false;
    static elements = [];
    constructor(x, y, width, height, style = new Style()) {
        super(x, y, width, height);
        this.style = style;
        UIElement.elements.push(this);
        log(this, "was ADDED to the list of drawed elements");
    }
    isDeleted() {
        return this.deleted;
    }
    delete() {
        const classes = [UIElement];
        for (const staticClass of classes) {
            const idx = staticClass.elements.indexOf(this);
            staticClass.elements.splice(idx, 1);
        }
        this.deleted = true;
        log(this, "was REMOVED from context");
    }
    draw() {
        getWrapper().ctx.fillStyle = this.style.background;
        getWrapper().ctx.fillRect(this.x, this.y, this.width, this.height);
        getWrapper().ctx.fillStyle = this.style.textColor;
        // TODO: Improve text rendering
        if (this.style.text) {
            const fontSize = this.style.fontSize ?? this.height;
            getWrapper().ctx.font = fontSize + "px " + this.style.fontFamily;
            const sizeDiff = this.height - fontSize;
            getWrapper().ctx.fillText(this.style.text, this.x, this.y + this.height - sizeDiff / 2, this.width);
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
        return (event) => {
            const rect = getWrapper().canvas.getBoundingClientRect();
            const position = new Vector(event.x - rect.x, event.y - rect.y);
            if (!position.insideCanvas())
                return;
            for (const element of this.elements)
                if (element.hit(position) && element.clickCallback)
                    element.clickCallback(event);
        };
    }
    /**
     * A static method that returns a callback function to handle keydown events.
     * This callback function iterates through all UIElement instances and invokes their keydownCallback if defined.
     *
     * @returns {(event: KeyboardEvent) => void} - A callback function that handles keydown events.
     */
    static getKeydownCallback() {
        return (event) => {
            for (const element of this.elements)
                if (element.keydownCallback)
                    element.keydownCallback(event);
        };
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
    velocity = Vector.zero();
    acceleration = Vector.zero();
    tickCallback;
    deleteIfOutOfBounds = false;
    collisionGroup = "default";
    collisionCallback;
    static elements = [];
    constructor(x, y, width, height, style) {
        super(x, y, width, height, style);
        Movable.elements.push(this);
    }
    delete() {
        const classes = [UIElement, Movable];
        for (const staticClass of classes) {
            const idx = staticClass.elements.indexOf(this);
            staticClass.elements.splice(idx, 1);
        }
        this.deleted = true;
        log(this, "was REMOVED from context");
    }
    collided() {
        const collidedElements = [];
        for (const other of Movable.elements) {
            if (this !== other
                && this.collisionGroup === other.collisionGroup
                && this.inside(other) !== -1)
                collidedElements.push(other);
        }
        return collidedElements;
    }
    /**
     * Updates the state of the element.
     * Checks for deletion conditions, checks collision, executes tickCallback and then calculates movement.
     * Callbacks are called in this order: collisionCallback (if collided) -> tickCallback -> movement calculations.
     */
    tick() {
        if (this.deleteIfOutOfBounds && this.insideCanvas() == -1) {
            this.delete();
            return;
        }
        const collidedElements = this.collided();
        for (const other of collidedElements) {
            if (this.collisionCallback)
                this.collisionCallback(this, other);
            if (other.collisionCallback)
                other.collisionCallback(other, this);
        }
        if (this.tickCallback)
            this.tickCallback(this);
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.velocity.add(this.acceleration);
    }
    /**
     * Iterates over all Movable elements and invokes their tick method.
     * This method is responsible for updating the state of each Movable element,
     * such as position and handling collisions.
     */
    static tickAll() {
        const elementsCopy = [...this.elements];
        for (const element of elementsCopy)
            element.tick();
    }
}
//# sourceMappingURL=canvas-library.js.map