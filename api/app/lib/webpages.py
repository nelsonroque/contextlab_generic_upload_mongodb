HTML_HOMEPAGE = """

<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="">
    <title>Activity Demos |  M2C2</title>    
    <!-- CSS only -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.0/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-gH2yIJqKdNHPEq0n4Mqa/HGKIhSkIHeL5AyhkYV8i59U5AR6csBvApHHNl/vI1Bx" crossorigin="anonymous">
    
    <!-- JavaScript Bundle with Popper -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.0/dist/js/bootstrap.bundle.min.js" integrity="sha384-A3rJD856KowSb7dwlZdYEkO39Gagi7vIsF0jrRAoQmDKKtQBHUuLZ9AsSv4jD4Xa" crossorigin="anonymous"></script>
    
  </head>
  <body class="container">
  
<h1>M2C2</h1>
<h4>Mobile Monitoring of Cognitive Change</h4>
<hr>
<table class="table">
<tr>
<th scope="col">Activity Name</th>
<th scope="col">Construct</th>
<th scope="col">Demo</th>
</tr>
{% for activity in activity_list %}
  <tr>
  <td>{{activity.name}}</td>
  <td>{{activity.construct}}</td>
  <td><a class='btn btn-lg btn-primary' href='{{INSTALL_URL}}/m2c2/c/{{activity.name}}?n_trials=3&api_key=e16a3173-a09e-43b5-81b2-d36369d64fe8'>Start Demo</a></td>
  </tr>
{% endfor %}
</body>
</html>
    
"""

HTML_HOMEPAGE_2 = """

<!DOCTYPE html>
<html>

<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Cache-Control" content="no-store, max-age=0" />
  <meta http-equiv="Pragma" content="no-cache" />
  <meta http-equiv="Expires" content="0" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <!-- <link href="assets/css/m2c2kit.css" rel="preload" as="style" />
  <link href="assets/css/m2c2kit.css" rel="stylesheet" /> -->
  <!-- If you are not using the m2c2kit survey functionality,
      remove css files below here -->
  <!--<link href="assets/css/defaultV2.css" rel="stylesheet" />
  <link href="assets/css/nouislider.css" rel="stylesheet" />
  <link href="assets/css/select2.css" rel="stylesheet" />
  <link href="assets/css/bootstrap-datepicker.standalone.css" rel="stylesheet" />
  <link href="assets/css/bootstrap-slider.css" rel="stylesheet" /> -->
  <!-- If you are not using the m2c2kit survey functionality,
      remove css files above here -->
  <script type="module" async>
  /**
 * When doing "no bundler" development, import from the esm modules. Make sure
 * they are in the lib folder and uploaded along with the rest of the files.
 * Each assessment's assets must also be included in its respective assets folder.
 */

import {{ ActivityType, EventType, Session }} from "./lib/m2c2kit.core.esm.js";
import {{ SymbolSearch }} from "https://api.contextlab.daytah.io/m2c2kit/ntc/lib/m2c2kit.assessment-symbol-search.esm.min.js";
import {{ GridMemory }} from "https://api.contextlab.daytah.io/m2c2kit/ntc/lib/m2c2kit.assessment-grid-memory.esm.min.js";
import {{ ColorDots }} from "https://api.contextlab.daytah.io/m2c2kit/ntc/lib/m2c2kit.assessment-color-dots.esm.min.js";
import {{ SessionUtils }} from "https://api.contextlab.daytah.io/m2c2kit/ntc/SessionUtils.js";

// GET URL Params here
// based on URL params, select task for study
const overlay_qs = window.location.search;
const overlay_params = new URLSearchParams(overlay_qs);

// extract specific URL params
const activity_name = overlay_params.get("activity_name") || "symbol-search";
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
        console.log(`âœ… trial complete:`);
      } else if (ev.target.type === ActivityType.Survey) {
        console.log(`âœ… survey response:`);
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
        console.log("ðŸ”´ ended session");

        // Send the "done" message to the parent window
        window.parent.postMessage('m2c2kit-done', '*');
        console.log("ðŸ”´ sent done message to parent window");
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
  </script>
</head>

<body class="m2c2kit-background-color m2c2kit-no-margin">
  <div id="m2c2kit-survey-div"></div>
  <div class="m2c2kit-full-viewport m2c2kit-flex-container" id="m2c2kit-canvas-div">
    <canvas class="m2c2kit-full-viewport" id="m2c2kit-canvas"></canvas>
    <div class="m2c2kit-loader" id="m2c2kit-loader-div"></div>
  </div>
</body>

</html>

"""