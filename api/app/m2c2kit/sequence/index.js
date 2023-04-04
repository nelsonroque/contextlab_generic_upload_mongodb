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
const task_order = overlay_params.get("order") || "None";
let activity_instance;

// get task order array
const activities_in_order = task_order.split(",");
var activities_container = [];
var activity_name;
var activity_trials;

// get each task and activity passed in URL
for (let i = 0; i < activities_in_order.length; i++) {
  console.log(activities_in_order[i]);
  var current_activity = activities_in_order[i];
  activity_name = current_activity.split(":")[0];
  activity_trials = current_activity.split(":")[1];

  // check if valid activity
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
  activity_instance.setParameters({ number_of_trials: Number(activity_trials), show_quit_button: false });

  // add activity to container
  activities_container.push(activity_instance);
}

// specify content for session
const session = new Session({
  canvasKitWasmUrl: "assets/canvaskit.wasm",
  activities: activities_container,
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
      SessionUtils.uploadData(ev, sessionParams);
    },
  },
  sessionCallbacks: {
    onSessionLifecycle: (ev) => {
      if (ev.type === EventType.SessionInitialize) {
        session.start();
      }
      if (ev.type === EventType.SessionEnd) {
        console.log("🔴 ended session");
        document.location.href = "/thankyou";
        /**
         * you may want to redirect somewhere else, because you will
         * now get a blank screen.
         * e.g., document.location.href = "https://www.example.com";
         */
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
