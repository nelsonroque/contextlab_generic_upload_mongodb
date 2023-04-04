import { Image, CanvasKit, FontMgr, Typeface, Canvas, Surface, EmbindObject, Font, Paint, ParagraphBuilder, Paragraph } from 'canvaskit-wasm';

declare class GlobalVariables {
    now: number;
    deltaTime: number;
    canvasScale: number;
    rootScale: number;
    canvasCssWidth: number;
    canvasCssHeight: number;
}

declare global {
    var Globals: GlobalVariables;
}
//# sourceMappingURL=Globals.d.ts.map

/**
 * The type of activity.
 *
 * @remarks Currently, m2c2kit has only Game and Survey activities.
 */
declare enum ActivityType {
    Game = "Game",
    Survey = "Survey"
}

declare class LoadedImage {
    name: string;
    image: Image;
    width: number;
    height: number;
    constructor(name: string, image: Image, width: number, height: number);
}

/**
 * Image that can be rendered by a browser from a URL or from a
 * HTML svg tag in string form. Provide either url or svgString, not both.
 */
interface BrowserImage {
    /** Name that will be used to refer to the image. Must be unique among all
     * images within a game */
    imageName: string;
    /** Width to scale image to */
    width: number;
    /** Height to scale image to */
    height: number;
    /** The HTML SVG tag, in string form, that will be rendered and loaded.
     * Must begin with &#60;svg> and end with &#60;/svg> */
    svgString?: string;
    /** URL of image asset (svg, png, jpg) to render and load */
    url?: string;
}

interface GameImages {
    uuid: string;
    images: Array<BrowserImage>;
}

declare class LoadedImages {
    [gameUuid: string]: {
        [name: string]: LoadedImage;
    };
}
declare class ImageManager {
    canvasKit?: CanvasKit;
    private renderedImages;
    loadedImages: LoadedImages;
    private _scratchCanvas?;
    private ctx?;
    private scale?;
    /**
     * Returns a CanvasKit Image that was previously rendered by the ImageManager.
     *
     * @remarks Typically, this won't be called directly because a programmer
     * will use a higher-level abstraction (m2c2kit Sprite).
     *
     * @param gameUuid - The game that the image resource is part of
     * @param imageName - The name given to the rendered image
     * @returns A CanvasKit Image
     */
    getLoadedImage(gameUuid: string, imageName: string): LoadedImage;
    /**
     * Adds a CanvasKit Image to the images available to a given game.
     *
     * @remarks Typically, a programmer won't call this because images will be
     * automatically rendered and loaded in the Activity async init.
     * The only time this function is called in-game is when our internal
     * methods add screenshot images needed for transitions.
     *
     * @param loadedImage - An image that has been converted to a CanvasKit Image
     * @param gameUuid - The game that the Image is part of
     */
    addLoadedImage(loadedImage: LoadedImage, gameUuid: string): void;
    /**
     * Renders game images from their original format (png, jpg, svg) to
     * CanvasKit Image.
     *
     * @remarks Typically, a programmer won't call this because the Session
     * object will manage this. Rendering is an async activity, and thus
     * this method returns a promise. Rendering of all images is done in
     * parallel.
     *
     * @param allGamesImages - An array of GameImages data structures that
     * specify the image's desired size, it's name, and where the image to be
     * rendered is located (e.g., embedded svgString or url)
     * @returns A promise that completes when all game images have rendered
     */
    renderImages(allGamesImages: Array<GameImages>): Promise<void[]>;
    /**
     * Adds all rendered CanvasKit Images to the images available to m2c2kit.
     *
     * @remarks Typically, a programmer won't call this because the Session
     * object will manage this.
     */
    loadAllGamesRenderedImages(): void;
    /**
     * Our private method rendering an image to a CanvasKit Image
     *
     * @remarks This is complex because there is a separate flow to render
     * svg images versus other (e.g., jpg, png). Svg images may be provided
     * in a url or inline. In addition, there is a Firefox svg rendering issue,
     * see below, that must be handled.
     * Additional complexity comes from the potentially multiple async steps and
     * the multiple errors that can happen throughout.
     *
     * @param gameUuid
     * @param browserImage
     * @returns A promise of type void
     */
    private renderBrowserImage;
    private convertRenderedDataUrlImageToCanvasKitImage;
    /**
     * Returns the scratchCanvas, which is an extra, non-visible canvas in the
     * DOM we use so the native browser can render images like svg, png, jpg,
     * that we later will convert to CanvasKit Image.
     */
    private get scratchCanvas();
    private dataURLtoArrayBuffer;
    removeScratchCanvas(): void;
}

interface GameFontUrls {
    uuid: string;
    fontUrls: Array<string>;
}

/**
 * Class for loading, preparing, and providing fonts to games.
 *
 * @remarks FOR INTERNAL USE ONLY
 */
declare class FontManager {
    canvasKit?: CanvasKit;
    fontMgr?: FontMgr;
    private gameTypefaces;
    private allGamesFontData?;
    /**
     * Gets a typeface that was previously loaded for the specified game.
     *
     * @param gameUuid
     * @param fontFamily
     * @returns the requested Typeface
     */
    getTypeface(gameUuid: string, fontFamily: string): Typeface;
    /**
     * Gets names of fonts loaded for the specified game.
     *
     * @param gameUuid
     * @returns array of font family names
     */
    getFontNames(gameUuid: string): Array<string>;
    /**
     * Fetches all fonts for all games.
     *
     * @param allGamesFontUrls
     * @returns
     */
    fetchFonts(allGamesFontUrls: Array<GameFontUrls>): Promise<void>;
    /**
     * Takes the fonts, which have been previously fetched and converted into
     * Array Buffers using FontManager.fetchFonts(), and makes them available
     * to our engine
     */
    loadAllGamesFontData(): void;
    /**
     * For the specified game, fetches all fonts in the array of urls and
     * stores fonts as array buffers.
     *
     * @param gameUuid
     * @param fontUrls - array of font urls
     * @returns
     */
    private fetchGameFontsAsArrayBuffers;
    /**
     * For the specified game, loads all fonts from array buffers and makes
     * fonts available within canvaskit as a Typeface
     *
     * @param gameUuid
     * @param fonts - array of fonts in array buffer form
     */
    private loadGameFonts;
}

/** Base interface for all Activity events. */
interface ActivityEvent extends EventBase {
    target: Activity;
}

/** Data from activities are stored as key (string) value pairs. */
interface ActivityKeyValueData {
    [key: string]: string | number | boolean | object | undefined | null;
}

/** A snapshot of performance at a single point in time.
 *
 * @remarks This describes performance of the application internals, not the
 * participant. Do not store participant data here. Use snake case because
 * these data will be directly exported to persistence.
 */
interface ActivityMetric {
    [key: string]: string | number | boolean | object | undefined | null;
    activity_type: ActivityType;
    activity_uuid: string;
    iso8601_timestamp: string;
}

interface JsonSchema {
    /** Data type of the value or array of acceptable data types. */
    type?: JsonSchemaDataType | JsonSchemaDataType[];
    /** Values the schema can have. */
    enum?: unknown[];
    /** Annotation to indicate the type of string value, e.g., "date-time" or "email". */
    format?: string;
    /** Intent of the schema. */
    title?: string;
    /** Description of the schema. */
    description?: string;
    /** If the value is an object, the properties in JsonSchema. */
    properties?: {
        [key: string]: JsonSchema;
    };
    /** If the value is an array, the array items in JsonSchema. */
    items?: JsonSchema;
    /** Required properties. */
    required?: string[];
    /** Reference to object definitions. */
    $ref?: string;
    /** Object definitions. */
    $defs?: object;
    /** Comment string. */
    $comment?: string;
    /** Dialect of JSON Schema. */
    $schema?: string;
    /** Default value. */
    default?: any;
}
declare type JsonSchemaDataType = "string" | "number" | "integer" | "object" | "array" | "boolean" | "null";

/**
 * All the data created by an activity.
 */
interface ActivityResults {
    /** All the data created by the activity. */
    data: ActivityKeyValueData;
    /** JSON schema describing the structure of the data. */
    dataSchema: JsonSchema;
    /** Parameters under which the activity was run. */
    activityConfiguration: unknown;
    /** JSON schema describing the activity parameters. */
    activityConfigurationSchema: JsonSchema;
    /** Metrics describing internal application performance. */
    activityMetrics?: Array<ActivityMetric>;
}

/**
 * Dispatched when new data is created by an activity.
 *
 * @remarks Event contains all the data created by an activity, with
 * separate properties for the newly created data. ActivityResultsEvent
 * inherts "data" from ActivityResults, which contains the complete data
 * up to this point (both new and existing data).
 */
interface ActivityResultsEvent extends ActivityEvent, ActivityResults {
    /** New data created by the activity, which dispatched this event */
    newData: ActivityKeyValueData;
    /** JSON schema describing the new data */
    newDataSchema: JsonSchema;
}

/**
 * Notifies when an activity starts, ends, cancels, or
 * creates data.
 */
interface ActivityLifecycleEvent extends ActivityEvent {
    results?: ActivityResults;
}

interface ActivityCallbacks {
    /** Callback executed when the activity lifecycle changes, such as when it ends. */
    onActivityLifecycle?: (event: ActivityLifecycleEvent) => void;
    /** Callback executed when an activity creates some data. */
    onActivityResults?: (event: ActivityResultsEvent) => void;
}

/** Base interface for all Session events. */
interface SessionEvent extends EventBase {
    target: Session;
}

/**
 * Notifies when a session starts, ends, or initializes.
 */
interface SessionLifecycleEvent extends SessionEvent {
}

interface SessionCallbacks {
    /** Callback executed when the session lifecycle changes, such as when it is initialized. */
    onSessionLifecycle?: (event: SessionLifecycleEvent) => void;
}

interface SessionOptions {
    /** The activities that compose this session */
    activities: Array<Activity>;
    /** Callbacks executed when activity events occurs, such as when activity creates data or ends */
    activityCallbacks?: ActivityCallbacks;
    /** Callbacks executed when session events occur */
    sessionCallbacks?: SessionCallbacks;
    /** Url of the canvaskit.wasm binary. Always set to the default value of "assets/canvaskit.wasm" */
    canvasKitWasmUrl: "assets/canvaskit.wasm";
    /** Use a specified session UUID, rather than create a new one */
    sessionUuid?: string;
    /** NOT IMPLEMENTED YET: Orientation the screen should be locked to for this session. Value will be passed into the ScreenOrientation.lock() Web API. */
    orientation?: "natural" | "landscape" | "portrait" | "portrait-primary" | "portrait-secondary" | "landscape-primary" | "landscape-secondary";
}

declare class Session {
    options: SessionOptions;
    fontManager: FontManager;
    imageManager: ImageManager;
    currentActivity?: Activity;
    uuid: string;
    private canvasKit?;
    /**
     * A Session contains one or more activities; currently, the only
     * class that implements Activity is Game, but Survey is planned.
     * The session manages the start and stop of activities, and
     * advancement to next activity
     *
     * @param options
     */
    constructor(options: SessionOptions);
    /**
     * Asynchronously initializes the m2c2kit engine and loads assets
     */
    init(): Promise<void>;
    /**
     * Starts the session and starts the first activity.
     */
    start(): void;
    /**
     * Declares the session ended and sends callback.
     */
    end(): void;
    private stop;
    /**
     * Frees up resources that were allocated to run the session.
     *
     * @remarks This will be done automatically by the m2c2kit library;
     * the end-user must not call this.
     */
    private dispose;
    /**
     * Stops the current activity and advances to next activity in the session.
     * If there is no activity after the current activity, throws error
     */
    advanceToNextActivity(): void;
    /**
     * Gets the next activity after the current one, or undefined if
     * this is the last activity.
     */
    get nextActivity(): Activity | undefined;
    /**
     * Depending on the type of activity, set the visibility of the survey div
     * and canvas div.
     *
     * @param activity - the activity to configure the DOM for
     */
    private configureDomForActivity;
    /**
     * Shows or hides the survey div.
     *
     * @param visible - true if the survey div should be visible
     */
    private setSurveyDivVisibility;
    /**
     * Shows or hides the canvas div.
     *
     * @param visible - true if the canvas div should be visible
     */
    private setCanvasDivVisibility;
    /**
     * Gets asynchronous assets, including initialization of canvaskit wasm,
     * fetching of fonts from specified urls, and rendering and fetching
     * of images
     * @returns
     */
    private getAsynchronousAssets;
    private loadCanvasKit;
    private loadAssets;
    private assignCanvasKit;
    private getFontsConfigurationFromGames;
    private getImagesConfigurationFromGames;
}

interface Activity {
    /** The type of activity: Game or Survey */
    type: ActivityType;
    /** Initializes the activity. All code to construct the activity's appearance and behavior must be placed in this method. */
    init(): void;
    /** Starts the activity */
    start(): void;
    /** Stops the activity */
    stop(): void;
    /** The activity's parent session */
    session: Session;
    /** The activity's unique identifier. NOTE: This is newly generated each session. The uuid for an activity will vary across sessions. */
    uuid: string;
    /** Human-friendly name of this activity */
    name: string;
    /** Short identifier of this activity */
    id: string;
    /** The value of performance.now() immediately before the activity begins */
    beginTimestamp: number;
    /** The value of new Date().toISOString() immediately before the activity begins */
    beginIso8601Timestamp: string;
    /** Set activity parameters if defaults are not desired*/
    setParameters(newParameters: any): void;
}

/**
 * Base interface for all m2c2kit events.
 *
 * @remarks I would have named it Event, but that would collide with
 * the existing DOM Event
 */
interface EventBase {
    /** Type of event. */
    type: EventType;
    /** The object on which the event occurred. */
    target: Entity | Session | Activity;
    /** Has the event been taken care of by the listener and not be dispatched to other targets? */
    handled?: boolean;
}
/**
 * The different events that are dispatched by m2c2kit.
 */
declare enum EventType {
    SessionInitialize = "SessionInitialize",
    SessionStart = "SessionStart",
    SessionEnd = "SessionEnd",
    ActivityStart = "ActivityStart",
    ActivityEnd = "ActivityEnd",
    ActivityCancel = "ActivityCancel",
    ActivityData = "ActivityData",
    TapDown = "TapDown",
    TapUp = "TapUp",
    TapUpAny = "TapUpAny",
    TapLeave = "TapLeave",
    PointerDown = "PointerDown",
    PointerUp = "PointerUp",
    PointerMove = "PointerMove",
    CompositeCustom = "CompositeCustom"
}

/** Base interface for all Entity events. */
interface EntityEvent extends EventBase {
    target: Entity;
}

interface EntityEventListener {
    type: EventType;
    entityUuid: string;
    callback: (event: EntityEvent) => void;
}

/**
 * Position in two-dimensional space.
 */
interface Point {
    /** Horizonal coordinate */
    x: number;
    /** Vertical coordinate */
    y: number;
}

/**
 * Describes an interaction between the pointer (mouse, touches) and an entity.
 *
 * @remarks I would have named it PointerEvent, but that would collide with
 * the existing DOM PointerEvent.
 */
interface M2PointerEvent extends EntityEvent {
    /** Point that was tapped on entity, relative to the entity coordinate system */
    point: Point;
    /** Buttons being pressed when event was fired. Taken from DOM MouseEvent.buttons */
    buttons: number;
}

/**
 * Desrcibes an interaction of a pointer (mouse, touches) pressing an entity.
 *
 * @remarks Unlike M2PointerEvent, TapEvent considers how the pointer, while
 * in the down state, moves in relation to the bounds of the entity.
 */
interface TapEvent extends EntityEvent {
    /** Point that was tapped on entity, relative to the entity coordinate system */
    point: Point;
    /** Buttons being pressed when event was fired. Taken from DOM MouseEvent.buttons */
    buttons: number;
}

interface DrawableOptions {
    /** Point within the entity that determines its position. Default is { x: 0.5, y: 0.5 }, which centers the entity on its position */
    anchorPoint?: Point;
    /** Value along the z-axis to determine drawing and tap order. Larger values are on top. */
    zPosition?: number;
}

/**
 * Constraints for defining relative layouts.
 *
 * @remarks FOR INTERNAL USE ONLY
 */
interface Constraints {
    /** Constrain the top (vertical axis) of this entity to the top of the specified entity. The tops of both will appear at the same vertical location */
    topToTopOf?: Entity | string;
    /** Constrain the top (vertical axis) of this entity to the bottom of the specified entity. This entity will appear immediately below the specified entity */
    topToBottomOf?: Entity | string;
    /** Constrain the bottom (vertical axis) of this entity to the top of the specified entity. This entity will appear immediately above of the specified entity */
    bottomToTopOf?: Entity | string;
    /** Constrain the bottom (vertical axis) of this entity to the bottom of the specified entity. The bottoms of both will appear at the same vertical location */
    bottomToBottomOf?: Entity | string;
    /** Constrain the start (horizontal axis) of this entity to the start of the specified entity. The start of both will appear at the same horizontal location */
    startToStartOf?: Entity | string;
    /** Constrain the start (horizontal axis) of this entity to the end of the specified entity. This entity will appear immediately to the right of the specified entity */
    startToEndOf?: Entity | string;
    /** Constrain the end (horizontal axis) of this entity to the end of the specified entity. The end of both will appear at the same horizontal location */
    endToEndOf?: Entity | string;
    /** Constrain the end (horizontal axis) of this entity to the start of the specified entity. This entity will appear immediately to the left of the specified entity */
    endToStartOf?: Entity | string;
    /** When opposing horizontal constraints are applied, the default is to center the entity within the constraints (horizontalBias = .5). Setting horizontalBias less than .5 will pull the entity towards the start (to the left). Setting horizontalBias greater than .5 will pull the entity towards the end (to the right)  */
    horizontalBias?: number;
    /** When opposing vertical constraints are applied, the default is to center the entity within the constraints (verticalBias = .5). Setting verticalBias less than .5 will pull the entity towards the top. Setting verticalBias greater than .5 will pull the entity towards the bottom */
    verticalBias?: number;
    [key: string]: Entity | string | number | undefined;
}

/**
 * The Layout allows relative positioning via constraints.
 * This is not fully implemented yet: DO NOT USE!
 * We use it internally for instructions.
 */
interface Layout {
    height?: number;
    width?: number;
    marginStart?: number;
    marginEnd?: number;
    marginTop?: number;
    marginBottom?: number;
    constraints?: Constraints;
}

/**
 * Color in red (0-255), green (0-255), blue (0-255), alpha (0-1) format. Must be numeric array of length 4.
 */
declare type RgbaColor = [number, number, number, number];

interface TextOptions {
    /** Text to be displayed */
    text?: string;
    /** Name of font to use for text. Must have been previously loaded */
    fontName?: string;
    /** Color of text. Default is Constants.DEFAULT_FONT_COLOR (WebColors.Black) */
    fontColor?: RgbaColor;
    /** Size of text. Default is Constants.DEFAULT_FONT_SIZE (16) */
    fontSize?: number;
}

/**
 * Width and height on two-dimensional space
 */
interface Size {
    /** Horizonal width, x-axis */
    width: number;
    /** Vertical height, y-axis */
    height: number;
}

interface EntityOptions {
    /** Name of the entity. Only needed if the entity will be referred to by name in a later function */
    name?: string;
    /** Position of the entity within its parent coordinate system. Default is (0, 0) */
    position?: Point;
    /** Scale of the entity. Default is 1.0 */
    scale?: number;
    /** Does the entity respond to user events, such as taps? Default is false */
    isUserInteractionEnabled?: boolean;
    /** Is the entity, and its children, hidden? (not displayed). Default is false */
    hidden?: boolean;
    /** FOR INTERNAL USE ONLY */
    layout?: Layout;
}

declare enum EntityType {
    Entity = "Entity",
    Scene = "Scene",
    Sprite = "Sprite",
    Label = "Label",
    TextLine = "TextLine",
    Shape = "Shape",
    Composite = "Composite"
}

declare type EasingFunction = (
/** elapsed time since start of action */
t: number, 
/** start value of value to be eased */
b: number, 
/** total change of value to be eased */
c: number, 
/** total duration of action */
d: number) => number;
/**
 * The Easings class has static methods for creating easings to be used in actions.
 */
declare class Easings {
    static none: EasingFunction;
    static linear: EasingFunction;
    static quadraticIn: EasingFunction;
    static quadraticOut: EasingFunction;
    static quadraticInOut: EasingFunction;
    static cubicIn: EasingFunction;
    static cubicOut: EasingFunction;
    static cubicInOut: EasingFunction;
    static quarticIn: EasingFunction;
    static quarticOut: EasingFunction;
    static quarticInOut: EasingFunction;
    static quinticIn: EasingFunction;
    static quinticOut: EasingFunction;
    static quinticInOut: EasingFunction;
    static sinusoidalIn: EasingFunction;
    static sinusoidalOut: EasingFunction;
    static sinusoidalInOut: EasingFunction;
    static exponentialIn: EasingFunction;
    static exponentialOut: EasingFunction;
    static exponentialInOut: EasingFunction;
    static circularIn: EasingFunction;
    static circularOut: EasingFunction;
    static circularInOut: EasingFunction;
}

interface IDrawable {
    draw(canvas: Canvas): void;
    warmup(canvas: Canvas): void;
    /**
     * Frees up resources that were allocated for this drawable entity.
     *
     * @remarks This will be done automatically by the m2c2kit library;
     * the end-user must not call this.
     */
    dispose(): void;
    anchorPoint: Point;
    zPosition: number;
}

interface SceneOptions extends EntityOptions, DrawableOptions {
    /** Background color of the scene. Default is Constants.DEFAULT_SCENE_BACKGROUND_COLOR (WebColors.White) */
    backgroundColor?: RgbaColor;
}

declare class Scene extends Entity implements IDrawable, SceneOptions {
    readonly type = EntityType.Scene;
    isDrawable: boolean;
    anchorPoint: {
        x: number;
        y: number;
    };
    zPosition: number;
    private _backgroundColor;
    _active: boolean;
    _transitioning: boolean;
    _setupCallback?: (scene: Scene) => void;
    _appearCallback?: (scene: Scene) => void;
    private backgroundPaint?;
    /**
     * Top-level entity that holds all other entities, such as sprites, rectangles, or labels, that will be displayed on the screen
     *
     * @remarks The scene is the game screen or stage, and fills the entire available screen. There are usually multiple screens to contain multiple stages of the game, such as various instruction pages or phases of a game.
     *
     * @param options - {@link SceneOptions}
     */
    constructor(options?: SceneOptions);
    initialize(): void;
    dispose(): void;
    set game(game: Game);
    /**
     * The game which this scene is a part of.
     *
     * @remarks Throws error if scene is not part of the game object.
     */
    get game(): Game;
    get backgroundColor(): RgbaColor;
    set backgroundColor(backgroundColor: RgbaColor);
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
    duplicate(newName?: string): Scene;
    /**
     * Code that will be called every time the scene is presented.
     *
     * @remarks Use this callback to set entities to their initial state, if
     * that state might be changed later. For example, if a scene allows
     * players to place dots on a grid, the setup() method should ensure the
     * grid is clear of any prior dots from previous times this scene may
     * have been displayed. In addition, if entities should vary in each
     * iteration, that should be done here.
     *
     * @param callback
     */
    onSetup(callback: (scene: Scene) => void): void;
    /**
     *
     * Code that will be called after the scene has finished any transitions
     * and has fully appeared on the screen.
     *
     * @param callback
     */
    onAppear(callback: (scene: Scene) => void): void;
    draw(canvas: Canvas): void;
    warmup(canvas: Canvas): void;
}

interface SlideTransitionOptions {
    /** Direction in which the slide action goes */
    direction: TransitionDirection;
    /** Duration, in millis, of the transition */
    duration: number;
    /** Easing function for movement; default is linear */
    easing?: EasingFunction;
}
/**
 * The Transition class has static methods for creating animations that run as one scene transitions to another.
 */
declare abstract class Transition {
    abstract type: TransitionType;
    abstract easing: EasingFunction;
    abstract duration: number;
    /**
     * Creates a scene transition in which the outgoing scene slides out and the incoming scene slides in, as if the incoming scene pushes it.
     *
     * @param options - {@link SlideTransitionOptions}
     * @returns
     */
    static slide(options: SlideTransitionOptions): SlideTransition;
    /**
     * Creates a scene transition with no animation or duration. The next scene is immediately drawn.
     */
    static none(): NoneTransition;
}
declare class NoneTransition extends Transition {
    type: TransitionType;
    easing: EasingFunction;
    duration: number;
    constructor();
}
declare class SlideTransition extends Transition {
    type: TransitionType;
    easing: EasingFunction;
    duration: number;
    direction: TransitionDirection;
    constructor(direction: TransitionDirection, duration: number, easing: EasingFunction);
}
declare enum TransitionType {
    Slide = "Slide",
    None = "None"
}
declare enum TransitionDirection {
    Up = "Up",
    Down = "Down",
    Right = "Right",
    Left = "Left"
}
declare class SceneTransition {
    scene: Scene;
    transition: Transition;
    constructor(scene: Scene, transition: Transition);
}

/**
 * TrialSchema defines the data that are generated for each trial. They are
 * key-value pairs in which the key is the variable name, and the value is
 * JSON Schema that defines the type of the variable.
 */
interface TrialSchema {
    [key: string]: JsonSchema;
}

/**
 * GameParameters are the configurable options that change how the game runs.
 * They are key-value pairs in which the key is the game parameter name, and
 * the value is JSON Schema that defines the type of the game parameter, with
 * a required parameter named "default" that is the default value for the
 * parameter.
 */
interface GameParameters {
    /** The key is the game parameter name */
    [key: string]: DefaultParameter;
}
interface DefaultParameter extends JsonSchema {
    /**  Default value for the game parameter. */
    default: any;
}

/**
 * Translations is a map of a locale to a map of keys to translations.
 *
 * @example
 * ```
 * const translations: Translations = {
 *   "en-US": {
 *     "NEXT_BUTTON": "Next"
 *   },
 *   "es-MX": {
 *     "NEXT_BUTTON": "Siguiente"
 *   }
 * }
 * ```
 */
interface Translations {
    [locale: string]: {
        [key: string]: string;
    };
}

/**
 * Options to specify HTML canvas, set game canvas size, and load game assets.
 */
interface GameOptions {
    /** Human-friendly name of this game */
    name: string;
    /** Short identifier of this game; unique among published games and url-friendly (no spaces, special characters, or slashes)*/
    id: string;
    /** Version of this game */
    version: string;
    /** Uri (repository, webpage, or other location where full information about the game can be found) */
    uri?: string;
    /** Brief description of game */
    shortDescription?: string;
    /** Full description of game */
    longDescription?: string;
    /** Id of the HTML canvas that game will be drawn on. If not provided, the first canvas found will be used */
    canvasId?: string;
    /** Width of game canvas */
    width: number;
    /** Height of game canvas */
    height: number;
    /** Stretch to fill screen? Default is false */
    stretch?: boolean;
    /** Schema of trial data; JSON object where key is variable name, value is data type */
    trialSchema?: TrialSchema;
    /** Default game parameters; JSON object where key is the game parameter, value is default value */
    parameters?: GameParameters;
    /** String array of urls from which to load fonts. The first element will be the default font */
    fontUrls?: Array<string>;
    /** Array of BrowserImage objects to render and load */
    images?: Array<BrowserImage>;
    /** Show FPS in upper left corner? Default is false */
    showFps?: boolean;
    /** Color of the html body, if the game does not fill the screen. Useful for showing scene boundaries. Default is the scene background color */
    bodyBackgroundColor?: RgbaColor;
    /** Maximum number of activity metrics to log. */
    maximumRecordedActivityMetrics?: number;
    /** The FPS will be logged in game metrics if the FPS is lower than this value. Default is 59, as defined in Constants.FPS_METRIC_REPORT_THRESHOLD */
    fpsMetricReportThreshold?: number;
    /** Adapt execution for unit testing? Default is false */
    _unitTesting?: boolean;
    /** Advance through time step-by-step, for development and debugging */
    timeStepping?: boolean;
    /** Translations for localization. */
    translations?: Translations;
}

interface GameData extends ActivityKeyValueData {
    trials: Array<TrialData>;
}

/**
 * Localization information that is passed to the I18n constructor.
 */
interface LocalizationOptions {
    /** Locale to use for localization, or "auto" to request from the environment. */
    locale: string;
    /** Locale to use if requested locale translation is not availble, or if "auto" locale was requested and environment cannot provide a locale. */
    fallbackLocale?: string;
    /** Font color for strings that are missing translation and use the fallback locale or untranslated string. */
    missingTranslationFontColor?: RgbaColor;
    /** Translations for localization. */
    translations?: Translations;
    /** Additional translations for localization provided through game parameters. These will be merged into existing translations. */
    additionalTranslations?: Translations;
}

declare class I18n {
    private _translations;
    locale: string;
    fallbackLocale: string;
    private environmentLocale;
    options: LocalizationOptions;
    static makeLocalizationParameters(): GameParameters;
    constructor(options: LocalizationOptions);
    t(key: string, useFallback?: boolean): string | undefined;
    get translations(): Translations;
    set translations(value: Translations);
    private getEnvironmentLocale;
    private mergeAdditionalTranslations;
}

interface TrialData {
    [key: string]: string | number | boolean | object | undefined | null;
}
declare class Game implements Activity {
    readonly type = ActivityType.Game;
    _canvasKit?: CanvasKit;
    _session?: Session;
    uuid: string;
    name: string;
    id: string;
    options: GameOptions;
    beginTimestamp: number;
    beginIso8601Timestamp: string;
    private gameMetrics;
    private fpsMetricReportThreshold;
    private maximumRecordedActivityMetrics;
    private stepCount;
    private steppingNow;
    i18n?: I18n;
    /**
     * The base class for all games. New games should extend this class.
     *
     * @param options - {@link GameOptions}
     */
    constructor(options: GameOptions);
    private addLocalizationParametersToGameParameters;
    init(): void;
    private getLocalizationOptionsFromGameParameters;
    private isLocalizationRequested;
    setParameters(newParameters: any): void;
    get canvasKit(): CanvasKit;
    set canvasKit(canvasKit: CanvasKit);
    get session(): Session;
    set session(session: Session);
    /** The scene, or its name as a string, to be presented when the game is started. If this is undefined, the game will start with the first scene that has been added */
    entryScene?: Scene | string;
    data: GameData;
    /** The 0-based index of the current trial */
    trialIndex: number;
    private htmlCanvas?;
    surface?: Surface;
    private showFps?;
    private bodyBackgroundColor?;
    private currentScene?;
    private priorUpdateTime?;
    private fpsTextFont?;
    private fpsTextPaint?;
    private drawnFrames;
    private lastFpsUpdate;
    private nextFpsUpdate;
    private fpsRate;
    private animationFramesRequested;
    private limitFps;
    private unitTesting;
    private gameStopRequested;
    private webGlRendererInfo;
    canvasCssWidth: number;
    canvasCssHeight: number;
    scenes: Scene[];
    private freeEntitiesScene;
    private incomingSceneTransitions;
    private currentSceneSnapshot?;
    private pendingScreenshot?;
    /**
     * Adds an entity as a free entity (an entity that is not part of a scene)
     * to the game.
     *
     * @remarks Once added to the game, a free entity will always be drawn,
     * and it will not be part of any scene transitions. This is useful if
     * an entity must persisently be drawn and not move with scene
     * transitions. The appearance of the free entity must be managed
     * by the programmer. Note: internally, the free entities are part of a
     * special scene (named "__freeEntitiesScene"), but this scene is handled
     * apart from regular scenes in order to achieve the free entity behavior.
     *
     * @param entity - entity to add as a free entity
     */
    addFreeEntity(entity: Entity): void;
    /**
     * Removes a free entity from the game.
     *
     * @remarks Throws exception if the entity to remove is not currently added
     * to the game as a free entity
     *
     * @param entity - the free entity to remove or its name as a string
     */
    removeFreeEntity(entity: Entity | string): void;
    /**
     * Removes all free entities from the game.
     */
    removeAllFreeEntities(): void;
    /**
     * Returns array of free entities that have been added to the game.
     *
     * @returns array of free entities
     */
    get freeEntities(): Array<Entity>;
    /**
     * Adds a scene to the game.
     *
     * @remarks A scene, and its children entities, cannot be presented unless it has been added to the game object.
     *
     * @param scene
     */
    addScene(scene: Scene): void;
    /**
     * Adds multiple scenes to the game.
     *
     * @param scenes
     */
    addScenes(scenes: Array<Scene>): void;
    /**
     * Removes a scene from the game.
     *
     * @param scene - the scene to remove or its name as a string
     */
    removeScene(scene: Scene | string): void;
    /**
     * Specifies the scene that will be presented upon the next frame draw.
     *
     * @param scene
     * @param transition
     */
    presentScene(scene: string | Scene, transition?: NoneTransition): void;
    /**
     * Gets the value of the game parameter. If parameterName
     * is not found, then throw exception.
     *
     * @param parameterName - the name of the game parameter whose value is requested
     * @returns
     */
    getParameter<T>(parameterName: string): T;
    /**
     * Gets the value of the game parameter. If parameterName
     * is not found, then return fallback value
     *
     * @param parameterName - the name of the game parameter whose value is requested
     * @param fallback - the value to return if parameterName is not found
     * @returns
     */
    getParameterOrFallback<T, U>(parameterName: string, fallbackValue: U): T | U;
    /**
     * Returns true if a game parameter exists for the given string.
     *
     * @param parameterName - the name of the game parameter whose existence is queried
     * @returns
     */
    hasParameter(parameterName: string): boolean;
    /**
     * Starts the game loop.
     *
     * @remarks If entryScene is undefined, the game will start with scene
     * defined in the game object's entryScene property. If that is undefined,
     * the game will start with the first scene in the game object's scenes.
     * If there are no scenes in the game object's scenes, it will throw
     * an error.
     *
     * @param entryScene - The scene (Scene object or its string name) to display when the game starts
     */
    start(entryScene?: Scene | string): void;
    private addTimeSteppingControlsToDom;
    private updateTimeSteppingOutput;
    private advanceStepsHandler;
    private removeTimeSteppingControlsFromDom;
    /**
     * Warms up the Skia-based shaders underlying canvaskit.
     *
     * @remarks Some canvaskit methods, such as drawImage, take extra time the
     * first time they are called. If the method is part of an animation,
     * then this may cause frame drops or "jank." To alleviate this, we can
     * "warm up" the shader associated with the method by calling it at the
     * beginning of our game. Thus, all warmup operations will be concentrated
     * at the beginning and will not be noticeable. We initialize and draw
     * all canvaskit objects that have been defined within m2c2kit entities,
     * and then immediately draw a white rectangle over them so that the
     * user does not see any flicker.
     *
     * @param surface - the canvaskit surface
     */
    private warmupShaders;
    stop(): void;
    /**
     * Frees up resources that were allocated to run the game.
     *
     * @remarks This will be done automatically by the m2c2kit library;
     * the end-user must not call this.
     */
    dispose(): void;
    private initData;
    private propertySchemaDataTypeIsValid;
    private getDeviceMetadata;
    /**
     * Adds data to the game's TrialData object.
     *
     * @remarks The variableName must be previously defined in the trialSchema
     * object passed in during game initialization through
     * {@link GameInitOptions.trialSchema}. The type of the value must match
     * what was defined in the trialSchema, otherwise an error is thrown.
     *
     * @param variableName - variable to be set
     * @param value - value of the variable to set
     */
    addTrialData(variableName: string, value: any): void;
    /**
     * Should be called when the current trial has completed. It will
     * also increment the trial index.
     *
     * @remarks Calling will trigger the onActivityDataCreate callback function,
     * if one was provided in SessionOptions. This is how the game communicates
     * trial data to the parent session, which can then save or process the data.
     * It is the responsibility of the the game programmer to call this at
     * the appropriate time. It is not triggered automatically.
     */
    trialComplete(): void;
    /**
     * The m2c2kit engine will automatically include these schema and their
     * values in the trial data.
     */
    private readonly automaticTrialSchema;
    private makeNewGameDataSchema;
    private makeGameDataSchema;
    /**
     * GameParameters combines default parameters values and
     * JSON Schema to describe what the parameters are.
     * The next two functions extract GameParameters's two parts
     * (the default values and the schema) so they can be returned
     * separately in the activityData event
     */
    private makeGameActivityConfiguration;
    private makeGameActivityConfigurationSchema;
    /**
     * Should be called when current game has ended successfully.
     *
     * @remarks This will trigger the onActivityLifecycleChange callback function,
     * if one was provided in SessionOptions. This is how the game can communicate
     * its state to the parent session. It is the responsibility of the the game
     * programmer to call this at the appropriate time. It is not triggered
     * automatically.
     */
    end(): void;
    /**
     * Should be called when current game has been canceled by a user action.
     *
     * @remarks This will trigger the onActivityLifecycleChange callback function,
     * if one was provided in SessionOptions. This is how the game can communicate
     * its state to the parent session. It is the responsibility of the the game
     * programmer to call this at the appropriate time. It is not triggered
     * automatically.
     */
    cancel(): void;
    private setupHtmlCanvases;
    private setupCanvasKitSurface;
    private setupFpsFont;
    private setupCanvasDomEventHandlers;
    private loop;
    snapshots: Image[];
    private updateGameTime;
    private handleIncomingSceneTransitions;
    /**
     * Creates a scene that has a screen shot of the current scene.
     *
     * @param outgoingSceneImage - an image of the current scene
     * @returns - the scene with the screen shot
     */
    private createOutgoingScene;
    private update;
    private draw;
    private calculateFps;
    private takeCurrentSceneSnapshot;
    private handlePendingScreenshot;
    /**
     * Takes screenshot of canvas
     *
     * @remarks Coordinates should be provided unscaled; that is, the method
     * will handle any scaling that happened due to device pixel ratios
     * not equal to 1. This returns a promise because the screenshot request
     * must be queued and completed once a draw cycle has completed. See
     * the loop() method.
     *
     * @param sx - Upper left coordinate of screenshot
     * @param sy - Upper right coordinate of screenshot
     * @param sw - width of area to screenshot
     * @param sh - hegith of area to screenshot
     * @returns Promise of Uint8Array of image data
     */
    takeScreenshot(sx?: number, sy?: number, sw?: number, sh?: number): Promise<Uint8Array | null>;
    private animateSceneTransition;
    private drawFps;
    /**
     * Creates an event listener for an entity based on the entity name
     *
     * @remarks Typically, event listeners will be created using a method specific to the event, such as onTapDown(). This alternative allows creation with entity name.
     *
     * @param type - the type of event to listen for, e.g., "tapdown"
     * @param entityName - the entity name for which an event will be listened
     * @param callback
     * @param replaceExistingCallback
     */
    createEventListener(type: EventType, entityName: string, callback: (event: EntityEvent) => void, replaceExistingCallback?: boolean): void;
    /**
     * Returns array of all entities that have been added to the game object.
     */
    get entities(): Array<Entity>;
    /**
     * Receives callback from DOM PointerDown event
     *
     * @param domPointerEvent - PointerEvent from the DOM
     * @returns
     */
    private htmlCanvasPointerDownHandler;
    private htmlCanvasPointerUpHandler;
    private htmlCanvasPointerMoveHandler;
    /**
     * Determines if/how m2c2kit entities respond to the DOM PointerDown event
     *
     * @param entity - entity that might be affected by the DOM PointerDown event
     * @param m2Event
     * @param domPointerEvent
     */
    private processDomPointerDown;
    private processDomPointerUp;
    private processDomPointerMove;
    private raiseM2PointerDownEvent;
    private raiseTapDownEvent;
    private raiseTapLeaveEvent;
    private raiseM2PointerUpEvent;
    private raiseTapUpEvent;
    private raiseTapUpAny;
    private raiseM2PointerMoveEvent;
    private calculatePointWithinEntityFromDomPointerEvent;
    private raiseEventOnListeningEntities;
    private sceneCanReceiveUserInteraction;
    /**
     *
     * Checks if the given canvas point is within the entity's bounds.
     *
     * @param entity - entity to check bounds for
     * @param x - x coordinate of the canvas point
     * @param y - y coordinate of the canvas point
     * @returns true if x, y point is within the entity's bounds
     */
    private IsCanvasPointWithinEntityBounds;
    private calculateEntityAbsoluteBoundingBox;
}

declare function handleInterfaceOptions(entity: Entity, options: EntityOptions): void;
declare abstract class Entity implements EntityOptions {
    type: EntityType;
    isDrawable: boolean;
    isShape: boolean;
    isText: boolean;
    name: string;
    position: Point;
    scale: number;
    isUserInteractionEnabled: boolean;
    hidden: boolean;
    layout: Layout;
    _game?: Game;
    parent?: Entity;
    children: Entity[];
    absolutePosition: Point;
    size: Size;
    absoluteScale: number;
    actions: Action[];
    queuedAction?: Action;
    originalActions: Action[];
    eventListeners: EntityEventListener[];
    readonly uuid: string;
    needsInitialization: boolean;
    userData: any;
    loopMessages: Set<string>;
    pressed: boolean;
    pressedInHitArea: boolean;
    constructor(options?: EntityOptions);
    initialize(): void;
    /**
     * The game which this entity is a part of.
     *
     * @remarks Throws error if entity is not part of the game object.
     */
    get game(): Game;
    /**
     * Overrides toString() and returns a human-friendly description of the entity.
     *
     * @remarks Inspiration from https://stackoverflow.com/a/35361695
     */
    toString: () => string;
    /**
     * Adds a child to this parent entity. Thows exception if the child's name
     * is not unique with respect to other children of this parent.
     *
     * @param child - The child entity to add
     */
    addChild(child: Entity): void;
    /**
     * Removes all children from the entity.
     */
    removeAllChildren(): void;
    /**
     * Removes the specific child from this parent entity. Throws exception if
     * this parent does not contain the child.
     *
     * @param child
     */
    removeChild(child: Entity): void;
    /**
     * Removes the children from the parent. Throws error if the parent does not
     * contain all of the children.
     *
     * @param children - An array of children to remove from the parent entity
     */
    removeChildren(children: Array<Entity>): void;
    /**
     * Searches all descendants by name and returns first matching entity.
     *
     * @remarks Descendants are children and children of children, recursively.
     * Throws exception if no descendant with the given name is found.
     *
     * @param name - Name of the descendant entity to return
     * @returns
     */
    descendant<T extends Entity>(name: string): T;
    /**
     * Returns all descendant entities.
     *
     * @remarks Descendants are children and children of children, recursively.
     */
    get descendants(): Array<Entity>;
    /**
     * Executes a callback when the user presses down on the entity.
     *
     * @remarks TapDown is a pointer down (mouse click or touches begin) within
     * the bounds of the entity.
     *
     * @param callback - function to execute
     * @param replaceExistingCallback  - should the provided callback replace
     * any existing callbacks of the same event type on this entity? Usually
     * there should be only one callback defined, instead of chaining multiple
     * ones. It is strongly recommended not to change this, unless you have a
     * special use case. Default is true.
     */
    onTapDown(callback: (tapEvent: TapEvent) => void, replaceExistingCallback?: boolean): void;
    /**
     * Executes a callback when the user releases a press, that has been fully
     * within the entity, from the entity.
     *
     * @remarks TapUp is a pointer up (mouse click release or touches end) within
     * the bounds of the entity and the pointer, while down, has never moved
     * beyond the bounds of the entity.
     *
     * @param callback - function to execute
     * @param replaceExistingCallback  - should the provided callback replace
     * any existing callbacks of the same event type on this entity? Usually
     * there should be only one callback defined, instead of chaining multiple
     * ones. It is strongly recommended not to change this, unless you have a
     * special use case. Default is true.
     */
    onTapUp(callback: (tapEvent: TapEvent) => void, replaceExistingCallback?: boolean): void;
    /**
     * Executes a callback when the user releases a press from the entity within
     * the bounds of the entity.
     *
     * @remarks TapUpAny is a pointer up (mouse click release or touches end)
     * within the bounds of the entity and the pointer, while down, is allowed to
     * have been beyond the bounds of the entity during the press before the
     * release.
     *
     * @param callback - function to execute
     * @param replaceExistingCallback  - should the provided callback replace
     * any existing callbacks of the same event type on this entity? Usually
     * there should be only one callback defined, instead of chaining multiple
     * ones. It is strongly recommended not to change this, unless you have a
     * special use case. Default is true.
     */
    onTapUpAny(callback: (tapEvent: TapEvent) => void, replaceExistingCallback?: boolean): void;
    /**
     * Executes a callback when the user moves the pointer (mouse, touches) beyond
     * the bounds of the entity while the pointer is down.
     *
     * @remarks TapLeave occurs when the pointer (mouse, touches) that has
     * previously pressed the entity moves beyond the bounds of the entity
     * before the press release.
     *
     * @param callback - function to execute
     * @param replaceExistingCallback  - should the provided callback replace
     * any existing callbacks of the same event type on this entity? Usually
     * there should be only one callback defined, instead of chaining multiple
     * ones. It is strongly recommended not to change this, unless you have a
     * special use case. Default is true.
     */
    onTapLeave(callback: (tapEvent: TapEvent) => void, replaceExistingCallback?: boolean): void;
    /**
     * Executes a callback when the pointer first is down on the entity.
     *
     * @remarks PointerDown is a pointer down (mouse click or touches begin) within
     * the bounds of the entity. It occurs under the same conditions as TapDown.
     *
     * @param callback - function to execute
     * @param replaceExistingCallback  - should the provided callback replace
     * any existing callbacks of the same event type on this entity? Usually
     * there should be only one callback defined, instead of chaining multiple
     * ones. It is strongly recommended not to change this, unless you have a
     * special use case. Default is true.
     */
    onPointerDown(callback: (m2PointerEvent: M2PointerEvent) => void, replaceExistingCallback?: boolean): void;
    /**
     * Executes a callback when the user releases a press from the entity within
     * the bounds of the entity.
     *
     * @remarks PointerUp is a pointer up (mouse click release or touches end)
     * within the bounds of the entity. It does not require that there was a
     * previous PointerDown on the entity.
     *
     * @param callback - function to execute
     * @param replaceExistingCallback  - should the provided callback replace
     * any existing callbacks of the same event type on this entity? Usually
     * there should be only one callback defined, instead of chaining multiple
     * ones. It is strongly recommended not to change this, unless you have a
     * special use case. Default is true.
     */
    onPointerUp(callback: (m2PointerEvent: M2PointerEvent) => void, replaceExistingCallback?: boolean): void;
    /**
     * Executes a callback when the user moves the pointer (mouse or touches)
     * within the bounds of the entity.
     *
     * @param callback - function to execute
     * @param replaceExistingCallback  - should the provided callback replace
     * any existing callbacks of the same event type on this entity? Usually
     * there should be only one callback defined, instead of chaining multiple
     * ones. It is strongly recommended not to change this, unless you have a
     * special use case. Default is true.
     */
    onPointerMove(callback: (m2PointerEvent: M2PointerEvent) => void, replaceExistingCallback?: boolean): void;
    private addEventListener;
    private parseLayoutConstraints;
    private calculateYFromConstraint;
    private calculateXFromConstraint;
    update(): void;
    /**
     * Draws each child entity that is Drawable and is not hidden, by zPosition
     * order (highest zPosition on top).
     *
     * @param canvas - CanvasKit canvas
     */
    drawChildren(canvas: Canvas): void;
    /**
     * Runs an action on this entity.
     *
     * @remarks If the entity is part of an active scene, the action runs
     * immediately. Otherwise, the action will run when the entity's scene
     * becomes active. Calling run() multiple times on an entity will add
     * to existing actions, not replace them.
     *
     * @param action - The action to run
     * @param key - key (string identifier) used to identify the action.
     * Only needed if the action will be referred to later
     */
    run(action: Action, key?: string): void;
    /**
     * Remove an action from this entity. If the action is running, it will be
     * stopped.
     *
     * @param key - key (string identifier) of the action to remove
     */
    removeAction(key: string): void;
    /**
     * Remove all actions from this entity. If actions are running, they will be
     * stopped.
     */
    removeAllActions(): void;
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
    abstract duplicate(newName?: string): Entity;
    protected getEntityOptions(): EntityOptions;
    protected getDrawableOptions(): DrawableOptions;
    protected getTextOptions(): TextOptions;
    /**
     * Gets the scene that contains this entity by searching up the ancestor tree recursively. Throws exception if entity is not part of a scene.
     *
     * @returns Scene that contains this entity
     */
    get canvasKit(): CanvasKit;
    get parentSceneAsEntity(): Entity;
    /**
     * For a given directed acyclic graph, topological ordering of the vertices will be identified using BFS
     * @param adjList Adjacency List that represent a graph with vertices and edges
     */
    private findTopologicalSort;
}

interface MoveActionOptions {
    /** Destination point. The point is relative to the entity's parent coordinate system */
    point: Point;
    /** Duration of move, in milliseconds */
    duration: number;
    /** Easing function for movement; default is linear */
    easing?: EasingFunction;
    /** Should the action run during screen trnsitions? Default is no */
    runDuringTransition?: boolean;
}

interface WaitActionOptions {
    /** Duration of wait, in milliseconds */
    duration: number;
    /** Should the action run during screen transitions? Default is no */
    runDuringTransition?: boolean;
}

interface CustomActionOptions {
    /** callback - The callback function to be executed  */
    callback: () => void;
    /** Should the action run during screen transitions? Default is no */
    runDuringTransition?: boolean;
}

interface ScaleActionOptions {
    /** The scaling ratio. 1 is no change, greater than 1 is make bigger, less than 1 is make smaller */
    scale: number;
    /** Duration of scale, in milliseconds */
    duration: number;
    /** Should the action run during screen transitions? Default is no */
    runDuringTransition?: boolean;
}

interface IActionContainer {
    children?: Array<Action>;
}

/** The type of action */
declare enum ActionType {
    Sequence = "Sequence",
    Group = "Group",
    Wait = "Wait",
    Custom = "Custom",
    Move = "Move",
    Scale = "Scale"
}

/**
 * The Action class has static methods for creating actions to be executed by
 * an Entity.
 */
declare abstract class Action {
    abstract type: ActionType;
    startOffset: number;
    endOffset: number;
    started: boolean;
    running: boolean;
    completed: boolean;
    runStartTime: number;
    duration: number;
    runDuringTransition: boolean;
    parent?: Action;
    isParent: boolean;
    isChild: boolean;
    key?: string;
    constructor(runDuringTransition?: boolean);
    /**
     * Creates an action that will move an entity to a point on the screen.
     *
     * @param options - {@link MoveActionOptions}
     * @returns The move action
     */
    static move(options: MoveActionOptions): Action;
    /**
     * Creates an action that will wait a given duration before it is considered complete.
     *
     * @param options - {@link WaitActionOptions}
     * @returns The wait action
     */
    static wait(options: WaitActionOptions): Action;
    /**
     * Creates an action that will execute a callback function.
     *
     * @param options - {@link CustomActionOptions}
     * @returns The custom action
     */
    static custom(options: CustomActionOptions): Action;
    /**
     * Creates an action that will scale the entity's size.
     *
     * @remarks Scaling is relative to any inherited scaling, which is multiplicative. For example, if the entity's parent is scaled to 2.0 and this entity's action scales to 3.0, then the entity will appear 6 times as large as original.
     *
     * @param options - {@link ScaleActionOptions}
     * @returns The scale action
     */
    static scale(options: ScaleActionOptions): Action;
    /**
     * Creates an array of actions that will be run in order.
     *
     * @remarks The next action will not begin until the current one has finished. The sequence will be considered completed when the last action has completed.
     *
     * @param actions - One or more actions that form the sequence
     * @returns
     */
    static sequence(actions: Array<Action>): Action;
    /**
     * Create an array of actions that will be run simultaneously.
     *
     * @remarks All actions within the group will begin to run at the same time. The group will be considered completed when the longest-running action has completed.
     *
     * @param actions - One or more actions that form the group
     * @returns
     */
    static group(actions: Array<Action>): Action;
    initialize(entity: Entity, key?: string): Array<Action>;
    static cloneAction(action: Action, key?: string): Action;
    static evaluateAction(action: Action, entity: Entity, now: number, dt: number): void;
    /**
     * Calculates the duration of an action, including any children actions
     * the action may contain.
     *
     * @remarks Uses recursion to handle arbitrary level of nesting parent
     * actions within parent actions
     *
     * @param action
     * @returns the calculated duration
     */
    private calculateDuration;
    /**
     * Update each action's start and end offsets.
     *
     * @remarks Uses recursion to handle arbitrary level of nesting parent
     * actions within parent actions.
     *
     * @param action that needs assigning start and end offsets
     */
    private calculateStartEndOffsets;
    /**
     * Takes an action hierarchy and flattens to an array of non-nested actions
     *
     * @remarks Uses recursion to handle arbitrary level of nesting parent
     * actions within parent actions
     *
     * @param action - the action to flatten
     * @param actions - the accumulator array of flattened actions. This will be
     * undefined on the first call, and an array on recursive calls
     * @returns flattened array of actions
     */
    private flattenActions;
    /**
     * Parses the action hierarchy and assigns each action its parent and
     * root action.
     *
     * @remarks Uses recursion to handle arbitrary level of nesting parent
     * actions within parent actions
     *
     * @param action
     * @param rootAction - top-level action passed to the run method
     * @param key - optional string to identify an action
     */
    private assignParents;
}
declare class SequenceAction extends Action implements IActionContainer {
    type: ActionType;
    children: Array<Action>;
    constructor(actions: Array<Action>);
}
declare class GroupAction extends Action implements IActionContainer {
    type: ActionType;
    children: Action[];
    constructor(actions: Array<Action>);
}
declare class CustomAction extends Action {
    type: ActionType;
    callback: () => void;
    constructor(callback: () => void, runDuringTransition?: boolean);
}
declare class WaitAction extends Action {
    type: ActionType;
    constructor(duration: number, runDuringTransition: boolean);
}
declare class MoveAction extends Action {
    type: ActionType;
    point: Point;
    startPoint: Point;
    dx: number;
    dy: number;
    easing: EasingFunction;
    constructor(point: Point, duration: number, easing: EasingFunction, runDuringTransition: boolean);
}
declare class ScaleAction extends Action {
    type: ActionType;
    scale: number;
    delta: number;
    constructor(scale: number, duration: number, runDuringTransition?: boolean);
}

declare class CanvasKitHelpers {
    /**
     * Frees up resources that were allocated by CanvasKit.
     *
     * @remarks This frees objects created in WebAssembly by
     * canvaskit-wasm. JavaScript garbage collection won't
     * free these wasm objects.
     */
    static Dispose(objects: Array<undefined | null | EmbindObject<Font | Paint | ParagraphBuilder | Paragraph | Image | Typeface | FontMgr>>): void;
}

interface CompositeOptions extends EntityOptions, DrawableOptions {
}

declare abstract class Composite extends Entity implements IDrawable {
    readonly type = EntityType.Composite;
    compositeType: string;
    isDrawable: boolean;
    anchorPoint: Point;
    zPosition: number;
    /**
     * Base Drawable object for creating custom entities ("composites") composed of primitive entities.
     *
     * @param options
     */
    constructor(options?: CompositeOptions);
    initialize(): void;
    dispose(): void;
    update(): void;
    draw(canvas: Canvas): void;
    abstract warmup(canvas: Canvas): void;
}

/**
 * Reasonable defaults to use if values are not specified.
 */
declare class Constants {
    /** Size of the font showing frames per second */
    static readonly FPS_DISPLAY_TEXT_FONT_SIZE = 12;
    /** Color of the font showing frames per second */
    static readonly FPS_DISPLAY_TEXT_COLOR: RgbaColor;
    /** Frequency, in milliseconds, at which to update frames per second metric shown on the screen */
    static readonly FPS_DISPLAY_UPDATE_INTERVAL = 1000;
    /** Maximum number of activity metrics to log. */
    static readonly MAXIMUM_RECORDED_ACTIVITY_METRICS = 32;
    /** The frames per second will be logged in game metrics if the FPS is lower than this value */
    static readonly FPS_METRIC_REPORT_THRESHOLD = 59;
    /** Scene color, if none is specified. */
    static readonly DEFAULT_SCENE_BACKGROUND_COLOR: RgbaColor;
    /** Shape fill color, if none is specified. */
    static readonly DEFAULT_SHAPE_FILL_COLOR: RgbaColor;
    /** Color of paths in a shape, if none is specified. */
    static readonly DEFAULT_PATH_STROKE_COLOR: RgbaColor;
    /** Line width of paths in a shape, if none is specified. */
    static readonly DEFAULT_PATH_LINE_WIDTH = 2;
    /** Color of text in Label and TextLine, if none is specified. */
    static readonly DEFAULT_FONT_COLOR: RgbaColor;
    /** Font size in Label and TextLine, if none is specified. */
    static readonly DEFAULT_FONT_SIZE = 16;
    static readonly LIMITED_FPS_RATE = 5;
    static readonly FREE_ENTITIES_SCENE_NAME = "__freeEntitiesScene";
    static readonly OUTGOING_SCENE_NAME = "__outgoingScene";
    static readonly OUTGOING_SCENE_SPRITE_NAME = "__outgoingSceneSprite";
    static readonly OUTGOING_SCENE_IMAGE_NAME = "__outgoingSceneSnapshot";
}

/**
 * This enum is used interally for processing the layout constraints. We use
 * an enum to avoid magic strings. NOTE: the casing in ConstraintType must
 * match the casing in Constraints.ts. Thus, this enum's members are in
 * lowercase, which is not typical Typescript style.
 */
declare enum ConstraintType {
    topToTopOf = "topToTopOf",
    topToBottomOf = "topToBottomOf",
    bottomToTopOf = "bottomToTopOf",
    bottomToBottomOf = "bottomToBottomOf",
    startToStartOf = "startToStartOf",
    startToEndOf = "startToEndOf",
    endToEndOf = "endToEndOf",
    endToStartOf = "endToStartOf"
}

declare enum Dimensions {
    MatchConstraint = 0
}

/**
 * Utility class for comparing equality of m2c2kit objects.
 */
declare class Equals {
    /**
     * Compares two RgbaColor objects and returns true if they are equal.
     *
     * @remarks If either of the colors is undefined, the comparison will
     * return false. RgbaColor is an array of 4 numbers, and thus is a
     * reference type. We need this method to compare two RgbaColor objects
     * for value equality.
     *
     * @param color1
     * @param color2
     * @returns
     */
    static rgbaColor(color1?: RgbaColor, color2?: RgbaColor): boolean;
}

interface FontData {
    gameUuid: string;
    fontUrl: string;
    fontArrayBuffer: ArrayBuffer;
}

interface IText {
    text?: string;
    fontName?: string;
    fontColor?: RgbaColor;
    fontSize?: number;
}

declare enum LabelHorizontalAlignmentMode {
    Center = 0,
    Left = 1,
    Right = 2
}

interface LabelOptions extends EntityOptions, DrawableOptions, TextOptions {
    /** Horizontal alignment of label text. see {@link LabelHorizontalAlignmentMode}. Default is LabelHorizontalAlignmentMode.center  */
    horizontalAlignmentMode?: LabelHorizontalAlignmentMode;
    /** Maximum width of label text before wrapping occurs. Default is the canvas width */
    preferredMaxLayoutWidth?: number;
    /** Background color  of label text. Default is no background color */
    backgroundColor?: RgbaColor;
}

declare class Label extends Entity implements IDrawable, IText, LabelOptions {
    readonly type = EntityType.Label;
    isDrawable: boolean;
    isText: boolean;
    anchorPoint: {
        x: number;
        y: number;
    };
    zPosition: number;
    private _text;
    private _fontName;
    private _fontColor;
    private _fontSize;
    private _horizontalAlignmentMode;
    private _preferredMaxLayoutWidth;
    private _backgroundColor?;
    private paragraph?;
    private paraStyle?;
    private builder?;
    private _translatedText;
    /**
     * Single or multi-line text formatted and rendered on the screen.
     *
     * @remarks Label (in contrast to TextLine) has enhanced text support for line wrapping, centering/alignment, and background colors.
     *
     * @param options - {@link LabelOptions}
     */
    constructor(options?: LabelOptions);
    initialize(): void;
    dispose(): void;
    get text(): string;
    set text(text: string);
    get translatedText(): string;
    get fontName(): string | undefined;
    set fontName(fontName: string | undefined);
    get fontColor(): RgbaColor;
    set fontColor(fontColor: RgbaColor);
    get fontSize(): number;
    set fontSize(fontSize: number);
    get horizontalAlignmentMode(): LabelHorizontalAlignmentMode;
    set horizontalAlignmentMode(horizontalAlignmentMode: LabelHorizontalAlignmentMode);
    get preferredMaxLayoutWidth(): number | undefined;
    set preferredMaxLayoutWidth(preferredMaxLayoutWidth: number | undefined);
    get backgroundColor(): RgbaColor | undefined;
    set backgroundColor(backgroundColor: RgbaColor | undefined);
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
    duplicate(newName?: string): Label;
    update(): void;
    draw(canvas: Canvas): void;
    warmup(canvas: Canvas): void;
}

/**
 * This class is used internally for processing layout constraints that
 * have been defined according to the Contraints interface.
 *
 * Imagine we have two entities, A and B. B's position is set
 * using its position property. A's position is set using the layout
 * constraint "bottomToTopOf B." A is the focal entity in this example.
 * What this means is that A's y coordinate will be computed such that
 * the bottom of A is the top of B. If A and B are squares, then A sits
 * on top of B with no gap.
 */
declare class LayoutConstraint {
    type: ConstraintType;
    alterEntity: Entity;
    verticalConstraint: boolean;
    focalEntityMinimum: boolean;
    alterEntityMinimum: boolean;
    verticalTypes: ConstraintType[];
    focalEntityMinimumTypes: ConstraintType[];
    alterEntityMinimumTypes: ConstraintType[];
    constructor(type: ConstraintType, alterEntity: Entity);
}

/**
 * A set of lines and/or shapes to draw.
 */
interface Path {
    /** The subpath that compose up the path */
    subpaths: Array<Array<Point>>;
    /** The size of the path. This is neeeded to properly position the shape that is drawn by the path */
    size: Size;
}

/**
 * Lines and/or shapes, and methods for creating them.
 */
declare class MutablePath implements Path {
    size: Size;
    _subpaths: Point[][];
    get subpaths(): Array<Array<Point>>;
    private currentPath;
    /**
     * Starts a new subpath at a given point.
     *
     * @param point - location at which to start the new subpath
     */
    move(point: Point): void;
    /**
     * Adds a straight line to the current subpath.
     *
     * @remarks The line is added from the last point in the current subpath to
     * the given point.
     *
     * @param point - location where the line will end
     */
    addLine(point: Point): void;
    clear(): void;
    duplicate(newName?: string | undefined): Entity;
}

declare class RandomDraws {
    /**
     * Draws a single random integer from a uniform distribution of integers in
     * the specified range.
     *
     * @param minimumInclusive - Lower bound of range
     * @param maximumInclusive - Upper bound of range
     * @returns A sampled integer
     */
    static SingleFromRange(minimumInclusive: number, maximumInclusive: number): number;
    /**
     * Draws random integers, without replacement, from a uniform distribution
     * of integers in the specified range.
     *
     * @param n - Number of draws
     * @param minimumInclusive - Lower bound of range
     * @param maximumInclusive - Upper bound of range
     * @returns An array of integers
     */
    static FromRangeWithoutReplacement(n: number, minimumInclusive: number, maximumInclusive: number): Array<number>;
    /**
     * Draw random grid cell locations, without replacement, from a uniform
     * distribution of all grid cells. Grid cell locations are zero-based,
     * i.e., upper-left is (0,0).
     *
     * @param n - Number of draws
     * @param rows  - Number of rows in grid; must be at least 1
     * @param columns - Number of columns in grid; must be at least 1
     * @param predicate - Optional lambda function that takes a grid row number
     * and grid column number pair and returns a boolean to indicate if the pair
     * should be allowed. For example, if one wanted to constrain the random
     * grid location to be along the diagonal, the predicate would be:
     * (row, column) => row === column
     * @returns Array of grid cells. Each cell is object in form of:
     * {row: number, column: number}. Grid cell locations are zero-based
     */
    static FromGridWithoutReplacement(n: number, rows: number, columns: number, predicate?: (row: number, column: number) => boolean): Array<{
        row: number;
        column: number;
    }>;
}

interface RectOptions {
    /** Position of rectangle */
    origin?: Point;
    /** Size of rectangle */
    size?: Size;
    /** X coordinate of rectangle position; this can be used instead of setting the origin property */
    x?: number;
    /** Y coordinate of rectangle position; this can be used instead of setting the origin property */
    y?: number;
    /** Width of rectangle; this can be used instead of setting the size property */
    width?: number;
    /** Height of rectangle; this can be used instead of setting the size property */
    height?: number;
}

declare enum ShapeType {
    Undefined = "Undefined",
    Rectangle = "Rectangle",
    Circle = "Circle",
    Path = "Path"
}

interface ShapeOptions extends EntityOptions, DrawableOptions {
    shapeType?: ShapeType;
    /** If provided, shape will be a circle with given radius */
    circleOfRadius?: number;
    /** If provided, shape will be a rectangle as specified in {@link Rect} */
    rect?: RectOptions;
    /** Radius of rectangle's corners */
    cornerRadius?: number;
    /** Color with which to fill shape. Default is Constants.DEFAULT_SHAPE_FILL_COLOR (WebColors.Red)  */
    fillColor?: RgbaColor;
    /** Color with which to outline shape. Default is no color for rectangle and circle, red for path. */
    strokeColor?: RgbaColor;
    /** Width of outline. Default is undefined for rectangle and cricle, 2 for path. */
    lineWidth?: number;
    /** A path from which to create the shape */
    path?: Path;
}

declare class Shape extends Entity implements IDrawable, ShapeOptions {
    readonly type = EntityType.Shape;
    isDrawable: boolean;
    isShape: boolean;
    anchorPoint: {
        x: number;
        y: number;
    };
    zPosition: number;
    shapeType: ShapeType;
    circleOfRadius?: number;
    rect?: RectOptions;
    path?: Path;
    cornerRadius: number;
    private _fillColor;
    private _strokeColor?;
    lineWidth?: number;
    private fillColorPaint?;
    private strokeColorPaint?;
    /**
     * Rectangular, circular, or path-based shape
     *
     * @param options - {@link ShapeOptions}
     */
    constructor(options?: ShapeOptions);
    initialize(): void;
    dispose(): void;
    get fillColor(): RgbaColor;
    set fillColor(fillColor: RgbaColor);
    get strokeColor(): RgbaColor | undefined;
    set strokeColor(strokeColor: RgbaColor | undefined);
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
    duplicate(newName?: string): Shape;
    update(): void;
    draw(canvas: Canvas): void;
    warmup(canvas: Canvas): void;
}

interface SpriteOptions extends EntityOptions, DrawableOptions {
    /** Name of image to use for sprite. Must have been previously loaded */
    imageName?: string;
}

declare class Sprite extends Entity implements IDrawable, SpriteOptions {
    readonly type = EntityType.Sprite;
    isDrawable: boolean;
    anchorPoint: {
        x: number;
        y: number;
    };
    zPosition: number;
    private _imageName;
    private loadedImage?;
    /**
     * Visual image displayed on the screen.
     *
     * @remarks Images that will be used to create the sprite must be loaded during the Game.init() method prior to their use.
     *
     * @param options - {@link SpriteOptions}
     */
    constructor(options?: SpriteOptions);
    initialize(): void;
    dispose(): void;
    set imageName(imageName: string);
    get imageName(): string;
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
    duplicate(newName?: string): Sprite;
    update(): void;
    draw(canvas: Canvas): void;
    warmup(canvas: Canvas): void;
}

interface StoryOptions {
    sceneNamePrefix?: string;
}

declare abstract class Story {
    static Create(options: StoryOptions): Array<Scene>;
}

interface TextLineOptions extends EntityOptions, DrawableOptions, TextOptions {
    width?: number;
}

declare class TextLine extends Entity implements IDrawable, IText, TextLineOptions {
    readonly type = EntityType.TextLine;
    isDrawable: boolean;
    isText: boolean;
    zPosition: number;
    anchorPoint: {
        x: number;
        y: number;
    };
    private _text;
    private _fontName;
    private _fontColor;
    private _fontSize;
    private paint?;
    private font?;
    private typeface;
    private _translatedText;
    private missingTranslationPaint?;
    /**
     * Single-line text rendered on the screen.
     *
     * @remarks TextLine has no paragraph formatting options; Label will be preferred in most use cases.
     *
     * @param options - {@link TextLineOptions}
     */
    constructor(options?: TextLineOptions);
    get text(): string;
    set text(text: string);
    get translatedText(): string;
    get fontName(): string | undefined;
    set fontName(fontName: string | undefined);
    get fontColor(): RgbaColor;
    set fontColor(fontColor: RgbaColor);
    get fontSize(): number;
    set fontSize(fontSize: number);
    update(): void;
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
    duplicate(newName?: string): TextLine;
    draw(canvas: Canvas): void;
    warmup(canvas: Canvas): void;
}

declare class Timer {
    private startTime;
    private stopTime;
    private stopped;
    /**
     * cumulativeElapsed is a cumulative total of elapsed time while the timer
     * was in previous started (running) states, NOT INCLUDING the possibily
     * active run's duration
     */
    private cumulativeElapsed;
    private name;
    private static _timers;
    constructor(name: string);
    /**
     * Aliases performance.now()
     *
     * @remarks The m2c2kit Timer class is designed to measure elapsed durations
     * after a designated start point for a uniquely named timer. However, if a
     * timestamp based on the
     * [time origin](https://developer.mozilla.org/en-US/docs/Web/API/DOMHighResTimeStamp#the_time_origin)
     * is needed, this method can be used.
     *
     * @returns a [DOMHighResTimeStamp](https://developer.mozilla.org/en-US/docs/Web/API/DOMHighResTimeStamp)
     */
    static now(): number;
    /**
     * Starts a millisecond-resolution timer based on
     * [performance.now()](https://developer.mozilla.org/en-US/docs/Web/API/Performance/now).
     *
     * @remarks The method throws an error if a timer with the given
     * name is already in a started state.
     *
     * @param name - The name of the timer to be started
     */
    static start(name: string): void;
    /**
     * Stops a timer.
     *
     * @remarks The method throws an error if a timer with the given
     * name is already in a stopped state, or if a timer with the
     * given name has not been started.
     *
     * @param name - The name of the timer to be stopped
     */
    static stop(name: string): void;
    /**
     * Restarts a timer.
     *
     * @remarks The timer elapsed duration is set to 0 and it starts anew.
     * The method throws an error if a timer with the given
     * name does not exist (if there is not a started or stopped timer
     * with the given name).
     *
     * @param name - The name of the timer to be restarted
     */
    static restart(name: string): void;
    /**
     * Returns the total time elapsed, in milliseconds, of the timer.
     *
     * @remarks The total time elapsed will include all durations from multiple
     * starts and stops of the timer, if applicable. A timer's elapsed duration
     * can be read while it is in started or stopped state. The method throws
     * an error if a timer with the given name does not exist.
     *
     * @param name - The name of the timer whose elapsed duration is requested
     */
    static elapsed(name: string): number;
    /**
     * Removes a timer.
     *
     * @remarks After removal, no additional methods can be used with a timer
     * of the given name, other than to start a new timer with the given name,
     * whose duration will begin at 0 again. The method throws an error if
     * a timer with the given name does not exist.
     *
     * @param name - The name of the timer to be removed
     */
    static remove(name: string): void;
    /**
     * Remove all timers.
     *
     * @remarks This method will {@link remove} any timers in a started or
     * stopped state. This method is idempotent; method is safe to call even
     * if there are no timers to remove; no errors are thrown if there are
     * not any timers that can be removed.
     */
    static removeAll(): void;
    /**
     * Checks if a timer of the given name exists.
     *
     * @remarks The method checks if there is a timer with the given name.
     *
     * @param name - The name of the timer to check for existence
     * @returns boolean
     */
    static exists(name: string): boolean;
}

declare class Uuid {
    static generate(): string;
}

declare class WebColors {
    static Transparent: RgbaColor;
    static MediumVioletRed: RgbaColor;
    static DeepPink: RgbaColor;
    static PaleVioletRed: RgbaColor;
    static HotPink: RgbaColor;
    static LightPink: RgbaColor;
    static Pink: RgbaColor;
    static DarkRed: RgbaColor;
    static Red: RgbaColor;
    static Firebrick: RgbaColor;
    static Crimson: RgbaColor;
    static IndianRed: RgbaColor;
    static LightCoral: RgbaColor;
    static Salmon: RgbaColor;
    static DarkSalmon: RgbaColor;
    static LightSalmon: RgbaColor;
    static OrangeRed: RgbaColor;
    static Tomato: RgbaColor;
    static DarkOrange: RgbaColor;
    static Coral: RgbaColor;
    static Orange: RgbaColor;
    static DarkKhaki: RgbaColor;
    static Gold: RgbaColor;
    static Khaki: RgbaColor;
    static PeachPuff: RgbaColor;
    static Yellow: RgbaColor;
    static PaleGoldenrod: RgbaColor;
    static Moccasin: RgbaColor;
    static PapayaWhip: RgbaColor;
    static LightGoldenrodYellow: RgbaColor;
    static LemonChiffon: RgbaColor;
    static LightYellow: RgbaColor;
    static Maroon: RgbaColor;
    static Brown: RgbaColor;
    static SaddleBrown: RgbaColor;
    static Sienna: RgbaColor;
    static Chocolate: RgbaColor;
    static DarkGoldenrod: RgbaColor;
    static Peru: RgbaColor;
    static RosyBrown: RgbaColor;
    static Goldenrod: RgbaColor;
    static SandyBrown: RgbaColor;
    static Tan: RgbaColor;
    static Burlywood: RgbaColor;
    static Wheat: RgbaColor;
    static NavajoWhite: RgbaColor;
    static Bisque: RgbaColor;
    static BlanchedAlmond: RgbaColor;
    static Cornsilk: RgbaColor;
    static DarkGreen: RgbaColor;
    static Green: RgbaColor;
    static DarkOliveGreen: RgbaColor;
    static ForestGreen: RgbaColor;
    static SeaGreen: RgbaColor;
    static Olive: RgbaColor;
    static OliveDrab: RgbaColor;
    static MediumSeaGreen: RgbaColor;
    static LimeGreen: RgbaColor;
    static Lime: RgbaColor;
    static SpringGreen: RgbaColor;
    static MediumSpringGreen: RgbaColor;
    static DarkSeaGreen: RgbaColor;
    static MediumAquamarine: RgbaColor;
    static YellowGreen: RgbaColor;
    static LawnGreen: RgbaColor;
    static Chartreuse: RgbaColor;
    static LightGreen: RgbaColor;
    static GreenYellow: RgbaColor;
    static PaleGreen: RgbaColor;
    static Teal: RgbaColor;
    static DarkCyan: RgbaColor;
    static LightSeaGreen: RgbaColor;
    static CadetBlue: RgbaColor;
    static DarkTurquoise: RgbaColor;
    static MediumTurquoise: RgbaColor;
    static Turquoise: RgbaColor;
    static Aqua: RgbaColor;
    static Cyan: RgbaColor;
    static Aquamarine: RgbaColor;
    static PaleTurquoise: RgbaColor;
    static LightCyan: RgbaColor;
    static Navy: RgbaColor;
    static DarkBlue: RgbaColor;
    static MediumBlue: RgbaColor;
    static Blue: RgbaColor;
    static MidnightBlue: RgbaColor;
    static RoyalBlue: RgbaColor;
    static SteelBlue: RgbaColor;
    static DodgerBlue: RgbaColor;
    static DeepSkyBlue: RgbaColor;
    static CornflowerBlue: RgbaColor;
    static SkyBlue: RgbaColor;
    static LightSkyBlue: RgbaColor;
    static LightSteelBlue: RgbaColor;
    static LightBlue: RgbaColor;
    static PowderBlue: RgbaColor;
    static Indigo: RgbaColor;
    static Purple: RgbaColor;
    static DarkMagenta: RgbaColor;
    static DarkViolet: RgbaColor;
    static DarkSlateBlue: RgbaColor;
    static BlueViolet: RgbaColor;
    static DarkOrchid: RgbaColor;
    static Fuchsia: RgbaColor;
    static Magenta: RgbaColor;
    static SlateBlue: RgbaColor;
    static MediumSlateBlue: RgbaColor;
    static MediumOrchid: RgbaColor;
    static MediumPurple: RgbaColor;
    static Orchid: RgbaColor;
    static Violet: RgbaColor;
    static Plum: RgbaColor;
    static Thistle: RgbaColor;
    static Lavender: RgbaColor;
    static MistyRose: RgbaColor;
    static AntiqueWhite: RgbaColor;
    static Linen: RgbaColor;
    static Beige: RgbaColor;
    static WhiteSmoke: RgbaColor;
    static LavenderBlush: RgbaColor;
    static OldLace: RgbaColor;
    static AliceBlue: RgbaColor;
    static Seashell: RgbaColor;
    static GhostWhite: RgbaColor;
    static Honeydew: RgbaColor;
    static FloralWhite: RgbaColor;
    static Azure: RgbaColor;
    static MintCream: RgbaColor;
    static Snow: RgbaColor;
    static Ivory: RgbaColor;
    static White: RgbaColor;
    static Black: RgbaColor;
    static DarkSlateGray: RgbaColor;
    static DimGray: RgbaColor;
    static SlateGray: RgbaColor;
    static Gray: RgbaColor;
    static LightSlateGray: RgbaColor;
    static DarkGray: RgbaColor;
    static Silver: RgbaColor;
    static LightGray: RgbaColor;
    static Gainsboro: RgbaColor;
    static RebeccaPurple: RgbaColor;
}

declare class WebGlInfo {
    /**
     * Returns graphics driver vendor and renderer information.
     *
     * @remarks Information is from parameters UNMASKED_VENDOR_WEBGL and
     * UNMASKED_RENDERER_WEBGL when asking for WEBGL_debug_renderer_info
     * from the WebGLRenderingContext.
     *
     * @returns string
     */
    static getRendererString(): string;
    /**
     * Removes the temporary canvas that was created to get WebGL information.
     */
    static dispose(): void;
}

export { Action, Activity, ActivityKeyValueData, ActivityLifecycleEvent, ActivityResultsEvent, ActivityType, BrowserImage, CanvasKitHelpers, Composite, CompositeOptions, Constants, ConstraintType, Constraints, CustomAction, CustomActionOptions, DefaultParameter, Dimensions, DrawableOptions, EasingFunction, Easings, Entity, EntityEvent, EntityEventListener, EntityOptions, EntityType, Equals, EventBase, EventType, FontData, FontManager, Game, GameData, GameOptions, GameParameters, GlobalVariables, GroupAction, I18n, IDrawable, IText, ImageManager, Label, LabelHorizontalAlignmentMode, LabelOptions, Layout, LayoutConstraint, LoadedImage, MoveAction, MoveActionOptions, MutablePath, NoneTransition, Path, Point, RandomDraws, RectOptions, RgbaColor, ScaleAction, ScaleActionOptions, Scene, SceneOptions, SceneTransition, SequenceAction, Session, SessionLifecycleEvent, SessionOptions, Shape, ShapeOptions, ShapeType, Size, SlideTransition, SlideTransitionOptions, Sprite, SpriteOptions, Story, StoryOptions, TextLine, TextLineOptions, TextOptions, Timer, Transition, TransitionDirection, TransitionType, Translations, TrialData, TrialSchema, Uuid, WaitAction, WaitActionOptions, WebColors, WebGlInfo, handleInterfaceOptions };
