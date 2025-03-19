export { init, getWrapper, Vector, Box, Style, UIElement, HTMLDisplayElement, Movable };
class CanvasWrapper {
    canvas;
    ctx;
    logsEnabled;
    canvasMirror;
    constructor(canvasOrSelector, logsEnabled, canvasMirror) {
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
        if (canvasMirror === true) {
            this.canvasMirror = this.createMirror();
        }
        else {
            this.canvasMirror = canvasMirror ? canvasMirror : undefined;
        }
    }
    createMirror() {
        function fillParent(element) {
            element.style.position = 'absolute';
            element.style.top = '0';
            element.style.left = '0';
            element.style.width = '100%';
            element.style.height = '100%';
        }
        const canvasAsDivWrapper = document.createElement('div');
        const styles = window.getComputedStyle(this.canvas);
        if (styles.cssText !== '') {
            canvasAsDivWrapper.style.cssText = styles.cssText;
        }
        else {
            const cssText = Array.from(styles).reduce((css, propertyName) => `${css}${propertyName}:${styles.getPropertyValue(propertyName)};`);
            canvasAsDivWrapper.style.cssText = cssText;
        }
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.width = '100%';
        wrapper.style.height = '100%';
        this.canvas.style.cssText = '';
        this.canvas.className = '';
        this.canvas.id = '';
        fillParent(this.canvas);
        this.canvas.parentElement?.appendChild(canvasAsDivWrapper);
        canvasAsDivWrapper.appendChild(wrapper);
        wrapper.appendChild(this.canvas);
        const mirror = document.createElement('div');
        fillParent(mirror);
        mirror.style.zIndex = '1';
        wrapper.appendChild(mirror);
        return mirror;
    }
}
let canvasWrapper;
function getWrapper() {
    if (!canvasWrapper)
        throw new Error("canvasWrapper was not initialized. Please call init(...) before using the library.");
    return canvasWrapper;
}
function init(canvasOrSelector, enableLogs = false, canvasMirror = false) {
    canvasWrapper = new CanvasWrapper(canvasOrSelector, enableLogs, canvasMirror);
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
    toCanvasPosition() {
        const canvas = getWrapper().canvas;
        const rect = canvas.getBoundingClientRect();
        const coeff = {
            x: canvas.width / rect.width,
            y: canvas.height / rect.height
        };
        this.x -= rect.x;
        this.x *= coeff.x;
        this.y -= rect.y;
        this.y *= coeff.y;
        return this;
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
        const elementRect = element.getBoundingClientRect();
        return new Box(elementRect.x, elementRect.y, elementRect.width, elementRect.height)
            .toCanvasPosition();
    }
    toCanvasPosition() {
        const canvas = getWrapper().canvas;
        const newOrigin = new Vector(this.x, this.y)
            .toCanvasPosition();
        const newSize = new Vector(this.x + this.width, this.y + this.height)
            .toCanvasPosition();
        this.x = newOrigin.x;
        this.y = newOrigin.y;
        this.width = newSize.x - newOrigin.x;
        this.height = newSize.y - newOrigin.y;
        return this;
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
class ParentElement {
    _childrenArray = [];
    _childrenIdMap = new Map();
    _childrenClassMap = new Map();
    _childrenTagMap = new Map();
    constructor(children = []) {
        for (const element of children) {
            this.appendChild(element);
        }
    }
    get children() {
        return this._childrenArray;
    }
    getChildById(id) {
        return this._childrenIdMap.get(id);
    }
    getChildrenByClassName(className) {
        return this._childrenClassMap.get(className) ?? [];
    }
    getChildrenByTag(tag) {
        return this._childrenTagMap.get(tag.toUpperCase()) ?? [];
    }
    appendChild(child) {
        function putIfAbsent(map, key, value) {
            if (!map.has(key))
                map.set(key, value);
        }
        this._childrenArray.push(child);
        if (child.element.id)
            this._childrenIdMap.set(child.element.id, child);
        if (child.element.className) {
            putIfAbsent(this._childrenClassMap, child.element.className, []);
            this._childrenClassMap.get(child.element.className).push(child);
        }
        if (child.element.tagName) {
            putIfAbsent(this._childrenTagMap, child.element.tagName, []);
            this._childrenTagMap.get(child.element.tagName).push(child);
        }
    }
    removeChild(child) {
        removeFrom(this._childrenArray, child);
        function removeFrom(array, obj, fromIndex) {
            const index = array.indexOf(obj, fromIndex);
            if (index === -1)
                return;
            array.splice(index, 1);
        }
        if (child.element.id)
            this._childrenIdMap.delete(child.element.id);
        if (child.element.className) {
            const children = this._childrenClassMap.get(child.element.className);
            if (children)
                removeFrom(children, child);
        }
    }
}
class HTMLDisplayElement extends ParentElement {
    element;
    _parentElement;
    constructor(element, parent) {
        super();
        if (typeof element === "string")
            element = document.createElement(element);
        this.element = element;
        const mirror = getWrapper().canvasMirror;
        if (!mirror)
            throw new Error("Disabled functionality because canvasMirror is not available");
        this.parentElement = parent ?? mirror;
    }
    appendChild(child) {
        super.appendChild(child);
        this.element.appendChild(child.element);
        if (child._parentElement instanceof HTMLDisplayElement)
            child.removeChild(this);
        child._parentElement = this;
    }
    get parentElement() {
        return this._parentElement;
    }
    set parentElement(value) {
        if (!(value instanceof HTMLDisplayElement) && value !== getWrapper().canvasMirror)
            throw new TypeError("parentElement must be an HTMLDisplayElement or the canvasMirror itself.");
        if (value instanceof HTMLDisplayElement)
            value.appendChild(this);
        else
            value.appendChild(this.element);
        this._parentElement = value;
    }
    get x() {
        const rect = this.element.getBoundingClientRect();
        const parentRect = this.element.parentElement?.getBoundingClientRect();
        return rect.x - (parentRect?.x ?? 0);
    }
    set x(value) {
        this.element.style.position = "absolute";
        this.element.style.left = value + "px";
    }
    get y() {
        const rect = this.element.getBoundingClientRect();
        const parentRect = this.element.parentElement?.getBoundingClientRect();
        return rect.y - (parentRect?.y ?? 0);
    }
    set y(value) {
        this.element.style.position = "absolute";
        this.element.style.top = value + "px";
    }
    get width() {
        const rect = this.element.getBoundingClientRect();
        return rect.width;
    }
    set width(value) {
        this.element.style.width = value + "px";
    }
    get height() {
        const rect = this.element.getBoundingClientRect();
        return rect.height;
    }
    set height(value) {
        this.element.style.height = value + "px";
    }
    static fromHTML(html, css, parent) {
        const parser = new DOMParser();
        const document = parser.parseFromString(html, "text/html");
        const element = document.body.firstChild;
        if (!(element instanceof HTMLElement))
            throw new Error("Invalid HTML text");
        element.style.cssText += css ?? "";
        return new this(element, parent);
    }
    /**
     * Parses a string of HTML and creates an array of HTMLDisplayElement instances
     * from the top-level elements in the HTML string. Each element is recursively
     * processed to include its children.
     *
     * @param html - A string containing HTML markup to be parsed into elements.
     * @param parent - An optional HTMLDisplayElement that will act as the parent
     *                 for the created elements. If not provided, the elements will
     *                 be appended to the canvas mirror.
     * @returns An array of HTMLDisplayElement instances created from the HTML string.
     *          Only elements whose parent is the provided parent parameter or the canvas mirror are included in the result.
     */
    static allFromHTML(html, parent) {
        const parser = new DOMParser();
        const document = parser.parseFromString(html, "text/html");
        const elementsCollection = document.body.children;
        const elements = Array.from(elementsCollection)
            .filter(elem => elem instanceof HTMLElement);
        const instances = [];
        function createRecursively(element, parent) {
            const instance = new HTMLDisplayElement(element, parent);
            instances.push(instance);
            const children = Array.from(element.children).filter(elem => elem instanceof HTMLElement);
            for (const child of children)
                createRecursively(child, instance);
        }
        for (const element of elements)
            createRecursively(element);
        const topInstances = instances.filter(elem => elem.parentElement === (parent ?? getWrapper().canvasMirror));
        return new ParentElement(topInstances);
    }
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
        const staticClass = UIElement;
        const idx = staticClass.elements.indexOf(this);
        staticClass.elements.splice(idx, 1);
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
     * @returns {(event: MouseEvent) => void} A callback function that handles click events.
     */
    static getClickCallback() {
        return (event) => {
            const position = new Vector(event.x, event.y).toCanvasPosition();
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
     * @returns {(event: KeyboardEvent) => void} A callback function that handles keydown events.
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
        super.delete();
        const staticClass = Movable;
        const idx = staticClass.elements.indexOf(this);
        staticClass.elements.splice(idx, 1);
        this.deleted = true;
        log(this, "was REMOVED from context");
    }
    /**
     * Checks for collisions with other Movable elements.
     *
     * @param considerCollisionGroup - If true, only collides with other Movable elements that have the same collisionGroup.
     *                                  If false, collides with any other Movable element. Default is true.
     *
     * @returns An array of Movable elements that this Movable element is currently colliding with.
     *          If no collisions are detected, returns an empty array.
     *
     * @remarks This method does not handle the response to collisions.
     *          To handle collision responses, use the collisionCallback property of the Movable elements.
     */
    collided(considerCollisionGroup = true) {
        const collidedElements = [];
        for (const other of Movable.elements) {
            if (this !== other
                && (this.collisionGroup === other.collisionGroup || !considerCollisionGroup)
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