// SOURCE: https://www.w3resource.com/javascript-exercises/javascript-math-exercise-23.php
// crypto.randomUUID() doesn't work in all browsers
function create_UUID() {
  var dt = new Date().getTime();
  var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    function (c) {
      var r = (dt + Math.random() * 16) % 16 | 0;
      dt = Math.floor(dt / 16);
      return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
    }
  );
  return uuid;
}

// -------------
// detect whether browser for a task is Chrome or Safari
// -------------

const userAgentString = window.navigator.userAgent;

const is_chrome =
  userAgentString.includes("Chrome/") || userAgentString.includes("CriOS/");
const is_safari = userAgentString.includes("Safari/");
const is_firefox =
  userAgentString.includes("Firefox/") ||
  userAgentString.includes("FxiOS/") ||
  userAgentString.includes("Gecko/");
const is_opera = userAgentString.includes("OPR/");

const is_valid_browser = (is_chrome || is_safari) && !is_firefox && !is_opera;

// -------------
// get formatted datetime string
// -------------

function get_current_datetime_string_formatted() {
  const options = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  };
  const curr_dt = new Date();
  const curr_dt_string = curr_dt.toString();
  const tz_string = curr_dt_string.substr(curr_dt_string.indexOf("("));

  // returns YYYY-mm-DD HH:MM:SS (Time Zone)
  return [
    curr_dt,
    `${curr_dt.getFullYear().toString().padStart(4, "0")}-${curr_dt
      .getMonth()
      .toString()
      .padStart(2, "0")}-${curr_dt
      .getDate()
      .toString()
      .padStart(2, "0")} ${curr_dt
      .getHours()
      .toString()
      .padStart(2, "0")}:${curr_dt
      .getMinutes()
      .toString()
      .padStart(2, "0")}:${curr_dt
      .getSeconds()
      .toString()
      .padStart(2, "0")} ${tz_string}`,
  ];
}

// -------------
// upload data to API
// -------------

function upload_data(data, DEBUG) {

  //if (!DEBUG) {
  const api_url =
    "https://api.contextlab.daytah.io/upload";

  // -------------------

  let xhr = new XMLHttpRequest();

  // -------------------

  // Create a state change callback that returns response from server
  xhr.onreadystatechange = function () {
    var response_ = new Object();
    response_.responseText = this.responseText;
    response_.readyState = xhr.readyState;
    response_.status = xhr.status;
    console.log(response_);
  };

  // -------------------

  if (!DEBUG) {
    var jd = new Object();

    // --- collect identifiers
    js.study_uid = "Project SEED";
    jd.user_uid = participant_id;
    jd.session_uid = session_id;
    jd.session_uuid = session_uuid;
    jd.activity_id = experiment_name;
    jd.timestamp_start = timestamp_start;
    jd.task_version = TASK_VERSION;
    jd.useragent = navigator.userAgent;
    jd.debug_flag = DEBUG;
    jd.event_type = event_type;

    // --- collect runtime info
    jd.window_location_href = window.location.href;
    jd.window_location_hostname = window.location.hostname;
    jd.window_location_protocol = window.location.protocol;
    jd.window_location_port = window.location.port;

    // --- collect window /screen information
    jd.window_innerHeight = window.innerHeight;
    jd.window_innerWidth = window.innerWidth;
    jd.screen_availHeight = screen.availHeight;
    jd.screen_availWidth = screen.availWidth;
    jd.screen_width = screen.width;
    jd.screen_height = screen.height;
    jd.screen_colorDepth = screen.colorDepth;
    jd.screen_pixelDepth = screen.pixelDepth;

    // ---collect trial data
    jd.data_json = JSON.stringify(data.trials);

    // --- stringify response and upload
    var data = JSON.stringify(jd);
    xhr.withCredentials = false;
    xhr.open("POST", api_url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    //xhr.setRequestHeader("X-API", "TEST");
    xhr.send(data);
    console.log(data);
  } else {
    console.log("Data not sent - in DEBUGGING MODE");
    console.log(data);
  }
}