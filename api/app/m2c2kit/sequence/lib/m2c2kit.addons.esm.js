import { Composite, WebColors, Shape, Label, CanvasKitHelpers, EventType, Easings, Story, Transition, TransitionDirection, LabelHorizontalAlignmentMode, Scene, Dimensions, Sprite } from './m2c2kit.core.esm.js';

class Grid extends Composite {
    /**
     * A rectangular grid that supports placement of entities within the grid's
     * cells.
     *
     * @remarks This composite entity is composed of rectangles and lines. It
     * has convenience functions for placing and clearing entities on the grid
     * by row and column position (zero-based indexing)
     *
     * @param options - {@link GridOptions}
     */
    constructor(options) {
        super(options);
        this.compositeType = "grid";
        // Grid options
        // TODO: make getter, setter for these so they can be changed after initial construction
        this.rows = 0;
        this.columns = 0;
        // default Grid is: transparent gray, red lines, line width 1
        this.gridBackgroundColor = [0, 0, 233, 0.25];
        this.gridLineColor = WebColors.Red;
        this.gridLineWidth = 1;
        this.gridChildren = new Array();
        if (options.size) {
            this.size = options.size;
        }
        else {
            throw new Error("grid size must be specified");
        }
        if (options.rows) {
            if (options.rows >= 1) {
                this.rows = options.rows;
            }
            else {
                throw new Error("rows must be at least 1");
            }
        }
        else {
            throw new Error("rows must be specified");
        }
        if (options.columns) {
            if (options.columns >= 1) {
                this.columns = options.columns;
            }
            else {
                throw new Error("columns must be at least 1");
            }
        }
        else {
            throw new Error("columns must be specified");
        }
        if (options.backgroundColor) {
            this.gridBackgroundColor = options.backgroundColor;
        }
        if (options.gridLineColor) {
            this.gridLineColor = options.gridLineColor;
        }
        if (options.gridLineWidth) {
            this.gridLineWidth = options.gridLineWidth;
        }
        this.cellWidth = this.size.width / this.columns;
        this.cellHeight = this.size.height / this.rows;
    }
    initialize() {
        // Remove all children, including gridLines because we may need to redraw them.
        // Call the base class (Entity) removeAllChildren. (hence, the super)
        // (note that we override removeAllChildren in this Grid class)
        super.removeAllChildren();
        this.gridBackground = new Shape({
            name: "_" + this.name + "-gridBackground",
            rect: { size: this.size },
            //size: this.size,
            fillColor: this.gridBackgroundColor,
            strokeColor: this.gridLineColor,
            lineWidth: this.gridLineWidth,
            isUserInteractionEnabled: this.isUserInteractionEnabled,
        });
        this.addChild(this.gridBackground);
        this.gridBackground.isUserInteractionEnabled =
            this.isUserInteractionEnabled;
        for (let col = 1; col < this.columns; col++) {
            const verticalLine = new Shape({
                name: "_" + this.name + "-gridVerticalLine-" + col,
                rect: {
                    size: { width: this.gridLineWidth, height: this.size.height },
                    origin: { x: -this.size.width / 2 + this.cellWidth * col, y: 0 },
                },
                fillColor: this.gridLineColor,
            });
            this.gridBackground.addChild(verticalLine);
        }
        for (let row = 1; row < this.rows; row++) {
            const horizontalLine = new Shape({
                name: "_" + this.name + "-gridHorizontalLine-" + row,
                rect: {
                    size: { width: this.size.width, height: this.gridLineWidth },
                    origin: { x: 0, y: -this.size.height / 2 + this.cellHeight * row },
                },
                fillColor: this.gridLineColor,
            });
            this.gridBackground.addChild(horizontalLine);
        }
        if (this.gridChildren) {
            this.gridChildren.forEach((gridChild) => {
                if (!this.cellWidth || !this.cellHeight || !this.gridBackground) {
                    throw new Error("cellWidth, cellHeight, or gridBackground undefined or null");
                }
                const x = -this.size.width / 2 +
                    this.cellWidth / 2 +
                    gridChild.column * this.cellWidth;
                const y = -this.size.height / 2 +
                    this.cellHeight / 2 +
                    gridChild.row * this.cellHeight;
                gridChild.entity.position = { x: x, y: y };
                this.gridBackground.addChild(gridChild.entity);
            });
        }
        this.needsInitialization = false;
    }
    // all entities that make up grid are added as children, so they
    // have their own dispose methods
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    dispose() { }
    /**
     * Duplicates an entity using deep copy.
     *
     * @remarks This is a deep recursive clone (entity and children).
     * The uuid property of all duplicated entities will be newly created,
     * because uuid must be unique.
     *
     * @param newName - optional name of the new, duplicated entity. If not
     * provided, name will be the new uuid
     */
    duplicate(newName) {
        const dest = new Grid(Object.assign(Object.assign(Object.assign({}, this.getEntityOptions()), this.getDrawableOptions()), { rows: this.rows, columns: this.columns, size: this.size, backgroundColor: this.gridBackgroundColor, gridLineWidth: this.gridLineWidth, gridLineColor: this.gridLineColor, name: newName }));
        if (this.children.length > 0) {
            dest.children = this.children.map((child) => {
                const clonedChild = child.duplicate();
                clonedChild.parent = dest;
                return clonedChild;
            });
        }
        return dest;
    }
    update() {
        super.update();
    }
    draw(canvas) {
        super.drawChildren(canvas);
    }
    warmup(canvas) {
        this.initialize();
        this.children
            .filter((child) => child.isDrawable)
            .forEach((child) => {
            child.warmup(canvas);
        });
    }
    // override Entity.RemoveAllChildren() so that when RemoveAllChildren() is called on a Grid,
    // it removes only entities added to the grid cells (what we call grid children), not the grid lines!
    // note: when we upgrade to typescript 4.3+, we can mark this with override keyword to make intention explicit
    /**
     * Removes all children from the grid, but retains grid lines.
     *
     */
    removeAllChildren() {
        if (this.gridChildren.length === 0) {
            return;
        }
        while (this.gridChildren.length) {
            this.gridChildren.pop();
        }
        this.needsInitialization = true;
    }
    /**
     * Adds an entity to the grid at the specified row and column position.
     *
     * @param entity - entity to add to the grid
     * @param row  - row position within grid to add entity; zero-based indexing
     * @param column - column position within grid to add entity; zero-based indexing
     */
    addAtCell(entity, row, column) {
        if (row < 0 || row >= this.rows || column < 0 || column >= this.columns) {
            console.warn(`warning: addAtCell() requested to add entity at row ${row}, column ${column}. This is outside the bounds of grid ${this.name}, which is size ${this.rows}x${this.columns}. Note that addAtCell() uses zero-based indexing. AddAtCell() will proceed, but may draw entities outside the grid`);
        }
        this.gridChildren.push({ entity: entity, row: row, column: column });
        this.needsInitialization = true;
    }
    /**
     * Removes all child entities at the specified row and column position.
     *
     * @param row - row position within grid at which to remove children; zero-based indexing
     * @param column - column position within grid at which to remove children; zero-based indexing
     */
    removeAllAtCell(row, column) {
        this.gridChildren = this.gridChildren.filter((gridChild) => gridChild.row != row && gridChild.column != column);
        this.needsInitialization = true;
    }
    // override Entity.RemoveChild() so that when RemoveChild() is called on a Grid, it removes the
    // entity from the gridBackground rectangle AND our grid's own list of children (in gridChildren)
    /**
     * Removes the child entity from the grid.
     *
     * @param entity - entity to remove
     */
    removeChild(entity) {
        if (!this.gridBackground) {
            throw new Error("gridBackground is null or undefined");
        }
        this.gridBackground.removeChild(entity);
        this.gridChildren = this.gridChildren.filter((gridChild) => gridChild.entity != entity);
        this.needsInitialization = true;
    }
}

class Button extends Composite {
    // todo: add getters/setters so button can respond to changes in its options
    // todo: add default "behaviors" (?) like button click animation?
    /**
     * A simple button of rectangle with text centered inside.
     *
     * @remarks This composite entity is composed of a rectangle and text. To
     * respond to user taps, the isUserInteractionEnabled property must be set
     * to true and an appropriate callback must be set to handle the tap event.
     *
     * @param options - {@link ButtonOptions}
     */
    constructor(options) {
        super(options);
        this.compositeType = "button";
        // Button options
        this._backgroundColor = WebColors.Black;
        this.size = { width: 200, height: 50 };
        this.cornerRadius = 9;
        this.fontSize = 20;
        this.text = "";
        this._fontColor = WebColors.White;
        if (options.text) {
            this.text = options.text;
        }
        if (options.size) {
            this.size = options.size;
        }
        if (options.cornerRadius) {
            this.cornerRadius = options.cornerRadius;
        }
        if (options.fontSize) {
            this.fontSize = options.fontSize;
        }
        if (options.fontColor) {
            this.fontColor = options.fontColor;
        }
        if (options.backgroundColor) {
            this.backgroundColor = options.backgroundColor;
        }
    }
    initialize() {
        this.removeAllChildren();
        this.backgroundPaint = new this.canvasKit.Paint();
        this.backgroundPaint.setColor(this.canvasKit.Color(this.backgroundColor[0], this.backgroundColor[1], this.backgroundColor[2], this.backgroundColor[3]));
        this.backgroundPaint.setStyle(this.canvasKit.PaintStyle.Fill);
        const buttonRectangle = new Shape({
            rect: { size: this.size },
            cornerRadius: this.cornerRadius,
            fillColor: this._backgroundColor,
        });
        this.addChild(buttonRectangle);
        const buttonLabel = new Label({
            text: this.text,
            fontSize: this.fontSize,
            fontColor: this.fontColor,
        });
        buttonRectangle.addChild(buttonLabel);
        this.needsInitialization = false;
    }
    dispose() {
        CanvasKitHelpers.Dispose([this.backgroundPaint]);
    }
    get backgroundColor() {
        return this._backgroundColor;
    }
    set backgroundColor(backgroundColor) {
        this._backgroundColor = backgroundColor;
        this.needsInitialization = true;
    }
    get fontColor() {
        return this._fontColor;
    }
    set fontColor(fontColor) {
        this._fontColor = fontColor;
        this.needsInitialization = true;
    }
    /**
     * Duplicates an entity using deep copy.
     *
     * @remarks This is a deep recursive clone (entity and children).
     * The uuid property of all duplicated entities will be newly created,
     * because uuid must be unique.
     *
     * @param newName - optional name of the new, duplicated entity. If not
     * provided, name will be the new uuid
     */
    duplicate(newName) {
        const dest = new Button(Object.assign(Object.assign(Object.assign(Object.assign({}, this.getEntityOptions()), this.getDrawableOptions()), this.getTextOptions()), { size: this.size, cornerRadius: this.cornerRadius, backgroundColor: this.backgroundColor, fontColor: this.fontColor, name: newName }));
        if (this.children.length > 0) {
            dest.children = this.children.map((child) => {
                const clonedChild = child.duplicate();
                clonedChild.parent = dest;
                return clonedChild;
            });
        }
        return dest;
    }
    update() {
        super.update();
    }
    draw(canvas) {
        super.drawChildren(canvas);
    }
    warmup(canvas) {
        this.initialize();
        this.children
            .filter((child) => child.isDrawable)
            .forEach((child) => {
            child.warmup(canvas);
        });
    }
}

var DialogResult;
(function (DialogResult) {
    DialogResult["Dismiss"] = "Dismiss";
    DialogResult["Positive"] = "Positive";
    DialogResult["Negative"] = "Negative";
})(DialogResult || (DialogResult = {}));
class Dialog extends Composite {
    // todo: add getters/setters so button can respond to changes in its options
    // todo: add default "behaviors" (?) like button click animation?
    constructor(options) {
        super(options);
        this.compositeType = "dialog";
        this._backgroundColor = WebColors.White;
        this.cornerRadius = 9;
        this.overlayAlpha = 0.5;
        this.contentText = "";
        this.positiveButtonText = "";
        this.negativeButtonText = "";
        this.zPosition = Number.MAX_VALUE;
        this.hidden = true;
        this._fontColor = WebColors.White;
        if (!options) {
            return;
        }
        if (options.overlayAlpha) {
            this.overlayAlpha = options.overlayAlpha;
        }
        if (options.messageText) {
            this.contentText = options.messageText;
        }
        if (options.positiveButtonText) {
            this.positiveButtonText = options.positiveButtonText;
        }
        if (options.negativeButtonText) {
            this.negativeButtonText = options.negativeButtonText;
        }
        // if (options.text) {
        //   this.text = options.text;
        // }
        if (options.size) {
            this.size = options.size;
        }
        if (options.cornerRadius) {
            this.cornerRadius = options.cornerRadius;
        }
        // if (options.fontSize) {
        //   this.fontSize = options.fontSize;
        // }
        if (options.fontColor) {
            this.fontColor = options.fontColor;
        }
        if (options.backgroundColor) {
            this.backgroundColor = options.backgroundColor;
        }
    }
    show() {
        this.hidden = false;
    }
    onDialolgResult(callback, replaceExistingCallback = true) {
        // By default, we'll replace the existing callback if there is one
        // Why? If the same setup code is called more than once for a scene that repeats, it could
        // add the same callback again. Usually, this is not the intent.
        // cast <(ev: EntityEvent) => void> is needed because callback parameter
        // in this onTapDown method has argument of type TapEvent, but
        // in the EntityEventListener type, the callback property expects a
        // callback with argument of type EntityEvent
        const eventListener = {
            type: EventType.CompositeCustom,
            entityUuid: this.uuid,
            callback: callback,
        };
        if (replaceExistingCallback) {
            this.eventListeners = this.eventListeners.filter((listener) => !(listener.entityUuid === eventListener.entityUuid &&
                listener.type === eventListener.type));
        }
        this.eventListeners.push(eventListener);
        // if (replaceExistingCallback) {
        //   this.eventListeners = this.eventListeners.filter(
        //     (listener) => listener.entityName !== eventListener.entityName
        //   );
        // }
        // this.eventListeners.push(eventListener);
    }
    initialize() {
        this.removeAllChildren();
        const overlay = new Shape({
            rect: {
                width: Globals.canvasCssWidth,
                height: Globals.canvasCssHeight,
                x: Globals.canvasCssWidth / 2,
                y: Globals.canvasCssHeight / 2,
            },
            fillColor: [0, 0, 0, this.overlayAlpha],
            zPosition: -1,
            isUserInteractionEnabled: true,
        });
        overlay.onTapDown((e) => {
            e.handled = true;
            this.hidden = true;
            if (this.eventListeners.length > 0) {
                this.eventListeners
                    .filter((listener) => listener.type === EventType.CompositeCustom)
                    .forEach((listener) => {
                    const dialogEvent = {
                        type: EventType.CompositeCustom,
                        target: this,
                        handled: false,
                        dialogResult: DialogResult.Dismiss,
                    };
                    listener.callback(dialogEvent);
                });
            }
        });
        this.addChild(overlay);
        const dialogBox = new Shape({
            rect: {
                width: 300,
                height: 150,
                x: Globals.canvasCssWidth / 2,
                y: Globals.canvasCssHeight / 2,
            },
            cornerRadius: this.cornerRadius,
            fillColor: this.backgroundColor,
            isUserInteractionEnabled: true,
        });
        dialogBox.onTapDown((e) => {
            e.handled = true;
        });
        this.addChild(dialogBox);
        const dialogBoxPrimaryText = new Label({
            text: this.contentText,
            fontSize: 24,
            position: { x: 200, y: 360 },
        });
        this.addChild(dialogBoxPrimaryText);
        const negativeButton = new Button({
            text: this.negativeButtonText,
            position: { x: 120, y: 440 },
            size: { width: 100, height: 40 },
            isUserInteractionEnabled: true,
            zPosition: 1,
        });
        negativeButton.onTapDown((e) => {
            e.handled = true;
            this.hidden = true;
        });
        negativeButton.onTapDown((e) => {
            e.handled = true;
            this.hidden = true;
            if (this.eventListeners.length > 0) {
                this.eventListeners
                    .filter((listener) => listener.type === EventType.CompositeCustom)
                    .forEach((listener) => {
                    const dialogEvent = {
                        type: EventType.CompositeCustom,
                        target: this,
                        handled: false,
                        dialogResult: DialogResult.Negative,
                    };
                    listener.callback(dialogEvent);
                });
            }
        });
        const positiveButton = new Button({
            text: this.positiveButtonText,
            position: { x: 280, y: 440 },
            size: { width: 100, height: 40 },
            isUserInteractionEnabled: true,
            zPosition: 1,
        });
        positiveButton.onTapDown((e) => {
            e.handled = true;
            this.hidden = true;
            if (this.eventListeners.length > 0) {
                this.eventListeners
                    .filter((listener) => listener.type === EventType.CompositeCustom)
                    .forEach((listener) => {
                    const dialogEvent = {
                        type: EventType.CompositeCustom,
                        target: this,
                        handled: false,
                        dialogResult: DialogResult.Positive,
                    };
                    listener.callback(dialogEvent);
                });
            }
        });
        this.addChild(negativeButton);
        this.addChild(positiveButton);
        this.needsInitialization = false;
    }
    get backgroundColor() {
        return this._backgroundColor;
    }
    set backgroundColor(backgroundColor) {
        this._backgroundColor = backgroundColor;
        this.needsInitialization = true;
    }
    get fontColor() {
        return this._fontColor;
    }
    set fontColor(fontColor) {
        this._fontColor = fontColor;
        this.needsInitialization = true;
    }
    /**
     * Duplicates an entity using deep copy.
     *
     * @remarks This is a deep recursive clone (entity and children).
     * The uuid property of all duplicated entities will be newly created,
     * because uuid must be unique.
     *
     * @param newName - optional name of the new, duplicated entity. If not
     * provided, name will be the new uuid
     */
    duplicate(newName) {
        throw new Error("duplicate not implemented");
        // const dest = new Dialog({
        //   ...this.getEntityOptions(),
        //   ...this.getDrawableOptions(),
        //   ...this.getTextOptions(),
        //   size: this.size,
        //   cornerRadius: this.cornerRadius,
        //   backgroundColor: this.backgroundColor,
        //   fontColor: this.fontColor,
        //   name: newName,
        // });
        // if (this.children.length > 0) {
        //   dest.children = this.children.map((child) => {
        //     const clonedChild = child.duplicate();
        //     clonedChild.parent = dest;
        //     return clonedChild;
        //   });
        // }
        //return dest;
    }
    update() {
        super.update();
    }
    draw(canvas) {
        super.drawChildren(canvas);
    }
    warmup(canvas) {
        this.initialize();
        this.children
            .filter((child) => child.isDrawable)
            .forEach((child) => {
            child.warmup(canvas);
        });
    }
}

const SCENE_TRANSITION_EASING = Easings.sinusoidalInOut;
const SCENE_TRANSITION_DURATION = 500;
class Instructions extends Story {
    /**
     * Create an array of scenes containing instructions on how to complete the task
     *
     * @param options - {@link InstructionsOptions}
     * @returns
     */
    static Create(options) {
        const scenes = new Array();
        options.instructionScenes.forEach((s, i) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10;
            const nextSceneTransition = (_b = (_a = s.nextSceneTransition) !== null && _a !== void 0 ? _a : options.nextSceneTransition) !== null && _b !== void 0 ? _b : Transition.slide({
                direction: TransitionDirection.Left,
                duration: SCENE_TRANSITION_DURATION,
                easing: SCENE_TRANSITION_EASING,
            });
            const backSceneTransition = (_d = (_c = s.backSceneTransition) !== null && _c !== void 0 ? _c : options.backSceneTransition) !== null && _d !== void 0 ? _d : Transition.slide({
                direction: TransitionDirection.Right,
                duration: SCENE_TRANSITION_DURATION,
                easing: SCENE_TRANSITION_EASING,
            });
            const backButtonText = (_f = (_e = s.backButtonText) !== null && _e !== void 0 ? _e : options.backButtonText) !== null && _f !== void 0 ? _f : "Back";
            const nextButtonText = (_h = (_g = s.nextButtonText) !== null && _g !== void 0 ? _g : options.nextButtonText) !== null && _h !== void 0 ? _h : "Next";
            const backButtonWidth = (_k = (_j = s.backButtonWidth) !== null && _j !== void 0 ? _j : options.backButtonWidth) !== null && _k !== void 0 ? _k : 125;
            const nextButtonWidth = (_m = (_l = s.nextButtonWidth) !== null && _l !== void 0 ? _l : options.nextButtonWidth) !== null && _m !== void 0 ? _m : 125;
            const backButtonHeight = (_p = (_o = s.backButtonHeight) !== null && _o !== void 0 ? _o : options.backButtonHeight) !== null && _p !== void 0 ? _p : 50;
            const nextButtonHeight = (_r = (_q = s.nextButtonHeight) !== null && _q !== void 0 ? _q : options.nextButtonHeight) !== null && _r !== void 0 ? _r : 50;
            const backgroundColor = (_s = s.backgroundColor) !== null && _s !== void 0 ? _s : options.backgroundColor;
            const imageAboveText = (_t = s.imageAboveText) !== null && _t !== void 0 ? _t : true;
            const imageMarginTop = (_u = s.imageMarginTop) !== null && _u !== void 0 ? _u : 0;
            const imageMarginBottom = (_v = s.imageMarginBottom) !== null && _v !== void 0 ? _v : 0;
            const textMarginStart = (_w = s.textMarginStart) !== null && _w !== void 0 ? _w : 48;
            const textMarginEnd = (_x = s.textMarginEnd) !== null && _x !== void 0 ? _x : 48;
            const textAlignmentMode = (_y = s.textAlignmentMode) !== null && _y !== void 0 ? _y : LabelHorizontalAlignmentMode.Left;
            const textFontSize = (_z = s.textFontSize) !== null && _z !== void 0 ? _z : 16;
            const titleFontSize = (_0 = s.titleFontSize) !== null && _0 !== void 0 ? _0 : 16;
            const titleMarginTop = (_1 = s.titleMarginTop) !== null && _1 !== void 0 ? _1 : 48;
            const backButtonBackgroundColor = (_3 = (_2 = s.backButtonBackgroundColor) !== null && _2 !== void 0 ? _2 : options.backButtonBackgroundColor) !== null && _3 !== void 0 ? _3 : WebColors.Black;
            const backButtonFontColor = (_5 = (_4 = s.backButtonFontColor) !== null && _4 !== void 0 ? _4 : options.backButtonFontColor) !== null && _5 !== void 0 ? _5 : WebColors.White;
            const nextButtonBackgroundColor = (_7 = (_6 = s.nextButtonBackgroundColor) !== null && _6 !== void 0 ? _6 : options.nextButtonBackgroundColor) !== null && _7 !== void 0 ? _7 : WebColors.Black;
            const nextButtonFontColor = (_9 = (_8 = s.nextButtonFontColor) !== null && _8 !== void 0 ? _8 : options.nextButtonFontColor) !== null && _9 !== void 0 ? _9 : WebColors.White;
            const sceneNamePrefix = (_10 = options.sceneNamePrefix) !== null && _10 !== void 0 ? _10 : "instructions";
            const scene = new Scene({
                name: sceneNamePrefix + "-" + (i + 1).toString().padStart(2, "0"),
                backgroundColor: backgroundColor,
            });
            let titleLabel;
            if (s.title !== undefined) {
                titleLabel = new Label({
                    text: s.title,
                    fontSize: titleFontSize,
                    layout: {
                        marginTop: titleMarginTop,
                        constraints: {
                            topToTopOf: scene,
                            startToStartOf: scene,
                            endToEndOf: scene,
                        },
                    },
                });
                scene.addChild(titleLabel);
            }
            let textLabel;
            if (s.text !== undefined) {
                textLabel = new Label({
                    text: s.text,
                    preferredMaxLayoutWidth: Dimensions.MatchConstraint,
                    horizontalAlignmentMode: textAlignmentMode,
                    fontSize: textFontSize,
                    layout: {
                        marginStart: textMarginStart,
                        marginEnd: textMarginEnd,
                        constraints: {
                            topToTopOf: scene,
                            bottomToBottomOf: scene,
                            startToStartOf: scene,
                            endToEndOf: scene,
                            verticalBias: s.textVerticalBias,
                        },
                    },
                });
                scene.addChild(textLabel);
            }
            if (s.imageName !== undefined) {
                let image;
                if (textLabel !== undefined) {
                    if (imageAboveText) {
                        image = new Sprite({
                            imageName: s.imageName,
                            layout: {
                                marginBottom: imageMarginBottom,
                                constraints: {
                                    bottomToTopOf: textLabel,
                                    startToStartOf: scene,
                                    endToEndOf: scene,
                                },
                            },
                        });
                    }
                    else {
                        image = new Sprite({
                            imageName: s.imageName,
                            layout: {
                                marginTop: imageMarginTop,
                                constraints: {
                                    topToBottomOf: textLabel,
                                    startToStartOf: scene,
                                    endToEndOf: scene,
                                },
                            },
                        });
                    }
                }
                else {
                    image = new Sprite({
                        imageName: s.imageName,
                        layout: {
                            constraints: {
                                topToTopOf: scene,
                                bottomToBottomOf: scene,
                                verticalBias: s.imageVerticalBias,
                                startToStartOf: scene,
                                endToEndOf: scene,
                            },
                        },
                    });
                }
                scene.addChild(image);
            }
            if (i > 0) {
                const backButton = new Button({
                    text: backButtonText,
                    fontColor: backButtonFontColor,
                    backgroundColor: backButtonBackgroundColor,
                    size: { width: backButtonWidth, height: backButtonHeight },
                    layout: {
                        marginStart: 32,
                        marginBottom: 80,
                        constraints: { bottomToBottomOf: scene, startToStartOf: scene },
                    },
                });
                backButton.isUserInteractionEnabled = true;
                backButton.onTapDown(() => {
                    scene.game.presentScene(sceneNamePrefix + "-" + (i + 1 - 1).toString().padStart(2, "0"), backSceneTransition);
                });
                scene.addChild(backButton);
            }
            const nextButton = new Button({
                name: "nextButton",
                text: nextButtonText,
                fontColor: nextButtonFontColor,
                backgroundColor: nextButtonBackgroundColor,
                size: { width: nextButtonWidth, height: nextButtonHeight },
                layout: {
                    marginEnd: 32,
                    marginBottom: 80,
                    constraints: { bottomToBottomOf: scene, endToEndOf: scene },
                },
            });
            nextButton.isUserInteractionEnabled = true;
            if (i !== options.instructionScenes.length - 1) {
                nextButton.onTapDown(() => {
                    scene.game.presentScene(sceneNamePrefix + "-" + (i + 1 + 1).toString().padStart(2, "0"), nextSceneTransition);
                });
            }
            else {
                if (options.postInstructionsScene !== undefined) {
                    nextButton.onTapDown(() => {
                        var _a;
                        scene.game.presentScene((_a = options.postInstructionsScene) !== null && _a !== void 0 ? _a : "", nextSceneTransition);
                    });
                }
                else {
                    nextButton.onTapDown(() => {
                        const sceneIndex = scene.game.scenes.indexOf(scene);
                        if (sceneIndex === -1) {
                            /**
                             * This should never happen, unless this instruction scene has
                             * been removed from the game.
                             */
                            console.warn("warning: postInstructionsScene is not defined, and next scene cannot be determined.");
                        }
                        else {
                            const nextSceneIndex = sceneIndex + 1;
                            if (nextSceneIndex < scene.game.scenes.length) {
                                scene.game.presentScene(scene.game.scenes[nextSceneIndex], nextSceneTransition);
                            }
                            else {
                                console.warn("warning: postInstructionsScene is not defined, and there is no next scene to present.");
                            }
                        }
                    });
                }
            }
            scene.addChild(nextButton);
            scenes.push(scene);
        });
        return scenes;
    }
}

export { Button, Dialog, DialogResult, Grid, Instructions };
