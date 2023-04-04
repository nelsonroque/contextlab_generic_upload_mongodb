import { Canvas } from 'canvaskit-wasm';
import { CompositeOptions, Size, RgbaColor, Composite, Entity, GlobalVariables, TextOptions, IText, EntityEvent, StoryOptions, Transition, Story, Scene, LabelHorizontalAlignmentMode } from '@m2c2kit/core';

interface GridOptions extends CompositeOptions {
    /** Number of rows in the grid. Must be 1 or greater */
    rows: number;
    /** Number of columns in the grid. Must be 1 or greater */
    columns: number;
    /** Size of the grid in pixels */
    size: Size;
    /** Background color of the grid. Default is a transparent gray */
    backgroundColor?: RgbaColor;
    /** Width of the grid lines. Default is 1 */
    gridLineWidth?: number;
    /** Color of the grid lines. Default is red */
    gridLineColor?: RgbaColor;
}
interface GridChild {
    entity: Entity;
    row: number;
    column: number;
}
declare class Grid extends Composite {
    compositeType: string;
    rows: number;
    columns: number;
    gridBackgroundColor: RgbaColor;
    gridLineColor: RgbaColor;
    gridLineWidth: number;
    cellWidth: number;
    cellHeight: number;
    gridChildren: GridChild[];
    private gridBackground?;
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
    constructor(options: GridOptions);
    initialize(): void;
    dispose(): void;
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
    duplicate(newName?: string): Grid;
    update(): void;
    draw(canvas: Canvas): void;
    warmup(canvas: Canvas): void;
    /**
     * Removes all children from the grid, but retains grid lines.
     *
     */
    removeAllChildren(): void;
    /**
     * Adds an entity to the grid at the specified row and column position.
     *
     * @param entity - entity to add to the grid
     * @param row  - row position within grid to add entity; zero-based indexing
     * @param column - column position within grid to add entity; zero-based indexing
     */
    addAtCell(entity: Entity, row: number, column: number): void;
    /**
     * Removes all child entities at the specified row and column position.
     *
     * @param row - row position within grid at which to remove children; zero-based indexing
     * @param column - column position within grid at which to remove children; zero-based indexing
     */
    removeAllAtCell(row: number, column: number): void;
    /**
     * Removes the child entity from the grid.
     *
     * @param entity - entity to remove
     */
    removeChild(entity: Entity): void;
}

declare global {
    var Globals: GlobalVariables;
}
//# sourceMappingURL=Globals.d.ts.map

interface ButtonOptions extends CompositeOptions, TextOptions {
    /** Size of button */
    size?: Size;
    /** Corner radius of button; can be used to make rounded corners */
    cornerRadius?: number;
    /** Background color of button. Default is WebColors.RoyalBlue */
    backgroundColor?: RgbaColor;
    /** Color of button text. Default is WebColors.White */
    fontColor?: RgbaColor;
}
declare class Button extends Composite implements IText {
    compositeType: string;
    private _backgroundColor;
    size: {
        width: number;
        height: number;
    };
    cornerRadius: number;
    fontSize: number;
    text: string;
    private _fontColor;
    private backgroundPaint?;
    /**
     * A simple button of rectangle with text centered inside.
     *
     * @remarks This composite entity is composed of a rectangle and text. To
     * respond to user taps, the isUserInteractionEnabled property must be set
     * to true and an appropriate callback must be set to handle the tap event.
     *
     * @param options - {@link ButtonOptions}
     */
    constructor(options: ButtonOptions);
    initialize(): void;
    dispose(): void;
    get backgroundColor(): RgbaColor;
    set backgroundColor(backgroundColor: RgbaColor);
    get fontColor(): RgbaColor;
    set fontColor(fontColor: RgbaColor);
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
    duplicate(newName?: string): Button;
    update(): void;
    draw(canvas: Canvas): void;
    warmup(canvas: Canvas): void;
}

interface DialogOptions extends CompositeOptions {
    /** Size of dialog box */
    size?: Size;
    /** Corner radius of dialog box; can be used to make rounded corners */
    cornerRadius?: number;
    /** Background color of dialog box. Default is WebColors.White */
    backgroundColor?: RgbaColor;
    /** Color of button text. Default is WebColors.White */
    fontColor?: RgbaColor;
    overlayAlpha?: number;
    positiveButtonText?: string;
    negativeButtonText?: string;
    positiveButtonColor?: RgbaColor;
    negativeButtonColor?: RgbaColor;
    messageText?: string;
}
declare enum DialogResult {
    Dismiss = "Dismiss",
    Positive = "Positive",
    Negative = "Negative"
}
interface DialogEvent extends EntityEvent {
    dialogResult: DialogResult;
}
declare class Dialog extends Composite {
    compositeType: string;
    private _backgroundColor;
    cornerRadius: number;
    overlayAlpha: number;
    contentText: string;
    positiveButtonText: string;
    negativeButtonText: string;
    zPosition: number;
    hidden: boolean;
    private _fontColor;
    private backgroundPaint?;
    constructor(options?: DialogOptions);
    show(): void;
    onDialolgResult(callback: (dailogResultEvent: DialogEvent) => void, replaceExistingCallback?: boolean): void;
    initialize(): void;
    get backgroundColor(): RgbaColor;
    set backgroundColor(backgroundColor: RgbaColor);
    get fontColor(): RgbaColor;
    set fontColor(fontColor: RgbaColor);
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
    duplicate(newName?: string): Dialog;
    update(): void;
    draw(canvas: Canvas): void;
    warmup(canvas: Canvas): void;
}

interface InstructionScene {
    /** Primary instruction text */
    text?: string;
    /** Margin from left screen edge to primary instruction text. Default is 48 */
    textMarginStart?: number;
    /** Margin from right to primary instruction text. Default is 48 */
    textMarginEnd?: number;
    /** Horizontal alignment of primary instruction text. see {@link LabelHorizontalAlignmentMode}. Default is LabelHorizontalAlignmentMode.left. */
    textAlignmentMode?: LabelHorizontalAlignmentMode;
    /** Default is to center primary instructions vertically within the scene (textVerticalBias = .5).  Setting textVerticalBias less than .5 will pull the text towards the top. Setting textVerticalBias greater than .5 will pull the text towards the bottom */
    textVerticalBias?: number;
    /** Font size of primary instruction text. Default is 16 */
    textFontSize?: number;
    /** A text heading to appear at the top of the scene */
    title?: string;
    /** Margin from top of screen edge to title text. Default is 48 */
    titleMarginTop?: number;
    /** Font size of title text. Default is 16 */
    titleFontSize?: number;
    /** Name of optional image to show */
    imageName?: string;
    /** Default is to center image vertically within the scene (imageVerticalBias = .5).  Setting imageVerticalBias less than .5 will pull the image towards the top. Setting imageVerticalBias greater than .5 will pull the image towards the bottom */
    imageVerticalBias?: number;
    /** If the image appears below the primary instruction text (imageAboveText = false), this is the margin from the bottom of the primary instruction text to the top of the image */
    imageMarginTop?: number;
    /** If the image appears above the primary instruction text (imageAboveText = true), this is the margin from the bottom of the image to the top of the primary instruction text */
    imageMarginBottom?: number;
    /** If an image is provided, should it appear above the primary text? Default is true */
    imageAboveText?: boolean;
    /** Background color for instruction scene. Will override what is set in InstructionsOptions */
    backgroundColor?: RgbaColor;
    /** Button text for the back button. Will override what is set in InstructionsOptions */
    backButtonText?: string;
    /** Button text for the next button. Will override what is set in InstructionsOptions */
    nextButtonText?: string;
    /** Width of back button. Will override what is set in InstructionsOptions */
    backButtonWidth?: number;
    /** Width of next button. Will override what is set in InstructionsOptions */
    nextButtonWidth?: number;
    /** Height of back button. Will override what is set in InstructionsOptions */
    backButtonHeight?: number;
    /** Height of next button. Will override what is set in InstructionsOptions */
    nextButtonHeight?: number;
    /** Color of back button. Will override what is set in InstructionsOptions */
    backButtonBackgroundColor?: RgbaColor;
    /** Color of back button text. Will override what is set in InstructionsOptions */
    backButtonFontColor?: RgbaColor;
    /** Color of next button. Will override what is set in InstructionsOptions */
    nextButtonBackgroundColor?: RgbaColor;
    /** Color of next button text. Will override what is set in InstructionsOptions */
    nextButtonFontColor?: RgbaColor;
    /** Scene transition when advancing to the next instruction scene. Will override what is set in InstructionsOptions */
    nextSceneTransition?: Transition;
    /** Scene transition when returning to the previous instruction scene. Will override what is set in InstructionsOptions */
    backSceneTransition?: Transition;
}
interface InstructionsOptions extends StoryOptions {
    /** Name to prefix to each instruction scene name. Default is "instructions." For example, if screenNamePrefix is "instructions", instruction scenes will be named "instructions-01", "instructions-02", etc. */
    sceneNamePrefix?: string;
    /** Name of scene that follows the last instruction scene. Clicking the "next" button on the last instruction screen will advance to this screen */
    postInstructionsScene?: string;
    /** Array of instruction scenes that form the instructions */
    instructionScenes: Array<InstructionScene>;
    /** Background color for instruction scenes. Can be overriden within a single instruction scene */
    backgroundColor?: RgbaColor;
    /** Scene transition when advancing to the next instruction scene. Default is push transition, to the left, 500 milliseconds duration. Can be overriden within a single instruction scene */
    nextSceneTransition?: Transition;
    /** Scene transition when returning to the previous instruction scene. Default is push transition, to the right, 500 milliseconds duration. Can be overriden within a single instruction scene */
    backSceneTransition?: Transition;
    /** Button text for the back button. Default is "Back". Can be overriden within a single instruction scene */
    backButtonText?: string;
    /** Button text for the next button. Default is "Next". Can be overriden within a single instruction scene */
    nextButtonText?: string;
    /** Width of back button. Default is 125. Can be overriden within a single instruction scene */
    backButtonWidth?: number;
    /** Width of next button. Default is 125. Can be overriden within a single instruction scene */
    nextButtonWidth?: number;
    /** Height of back button. Default is 50. Can be overriden within a single instruction scene */
    backButtonHeight?: number;
    /** Height of next button. Default is 50. Can be overriden within a single instruction scene */
    nextButtonHeight?: number;
    /** Color of back button. Default is WebColors.Black. Can be overriden within a single instruction scene */
    backButtonBackgroundColor?: RgbaColor;
    /** Color of back button text. Default is WebColors.White. Can be overriden within a single instruction scene */
    backButtonFontColor?: RgbaColor;
    /** Color of next button. Default is WebColors.Black. Can be overriden within a single instruction scene */
    nextButtonBackgroundColor?: RgbaColor;
    /** Color of next button text. Default is WebColors.White. Can be overriden within a single instruction scene */
    nextButtonFontColor?: RgbaColor;
}
declare class Instructions extends Story {
    /**
     * Create an array of scenes containing instructions on how to complete the task
     *
     * @param options - {@link InstructionsOptions}
     * @returns
     */
    static Create(options: InstructionsOptions): Array<Scene>;
}

export { Button, ButtonOptions, Dialog, DialogOptions, DialogResult, Grid, GridOptions, Instructions, InstructionsOptions };
