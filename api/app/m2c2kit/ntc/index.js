/**
 * When doing "no bundler" development, import from the esm modules. Make sure
 * they are in the lib folder and uploaded along with the rest of the files.
 * Each assessment's assets must also be included in its respective assets folder.
 */
import { ActivityType, EventType, Session } from "./lib/m2c2kit.core.esm.js";
import { SymbolSearch } from "./lib/m2c2kit.assessment-symbol-search.esm.min.js";
import { GridMemory } from "./lib/m2c2kit.assessment-grid-memory.esm.min.js";
import { ColorDots } from "./lib/m2c2kit.assessment-color-dots.esm.min.js";
import { SessionUtils } from "./SessionUtils.js";

// GET URL Params here
// based on URL params, select task for study
const overlay_qs = window.location.search;
const overlay_params = new URLSearchParams(overlay_qs);

// extract specific URL params
const activity_name = overlay_params.get("activity_name") || "None";
const n_trials = overlay_params.get("n_trials") || 1;
let activity_instance;

// setup task based on URL
switch(activity_name) {
  case "symbol-search":
    activity_instance = new SymbolSearch();
    break;
  case "grid-memory":
    activity_instance = new GridMemory();
    break;
  case "color-dots":
    activity_instance = new ColorDots();
    break;
  default:
    console.log("invalid activity");
}

// specify task params
console.log("setting parameters from URL");
activity_instance.setParameters({ number_of_trials: Number(n_trials), show_quit_button: false });

// specify content for session
const session = new Session({
  canvasKitWasmUrl: "assets/canvaskit.wasm",
  activities: [activity_instance],
  activityCallbacks: {
    onActivityLifecycle: (ev) => {
      if (
        ev.type === EventType.ActivityEnd ||
        ev.type === EventType.ActivityCancel
      ) {
        const nextActivity = session.nextActivity;
        if (nextActivity) {
          session.advanceToNextActivity();
        } else {
          session.end();
        }
      }
    },
    onActivityResults: (ev) => {
      if (ev.target.type === ActivityType.Game) {
        console.log(`✅ trial complete:`);
      } else if (ev.target.type === ActivityType.Survey) {
        console.log(`✅ survey response:`);
      }

      const trials = ev.data.trials;
      const sessionParams = SessionUtils.getSessionParams();
      SessionUtils.addSessionParamsToTrials(trials, sessionParams);
      SessionUtils.addSessionParamsToDataSchema(ev.dataSchema);
      //SessionUtils.uploadData(ev, sessionParams);
    },
  },
  sessionCallbacks: {
    onSessionLifecycle: (ev) => {
      if (ev.type === EventType.SessionInitialize) {
        session.start();
        window.parent.postMessage('m2c2kit-start', '*');
      }
      if (ev.type === EventType.SessionEnd) {
        console.log("🔴 ended session");

        // Send the "done" message to the parent window
        window.parent.postMessage('m2c2kit-done', '*');
        console.log("🔴 sent done message to parent window");
      }
    },
  },
});

window.session = session;
session.init().then(() => {
  const loaderDiv = document.getElementById("m2c2kit-loader-div");
  if (loaderDiv) {
    loaderDiv.classList.remove("m2c2kit-loader");
  }
});
