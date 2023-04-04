import { Uuid } from "./lib/m2c2kit.core.esm.min.js";

/**
 * Session information from the query parameters.
 * @typedef {Object} SessionParams
 * @property {string} session_id
 * @property {string} study_id
 * @property {string} participant_id
 * @property {string} api_key
 */

export class SessionUtils {
  /**
   * Extracts key URL params
   * @returns {SessionParams}
   */
  static getSessionParams() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    // extract specific URL params
    const session_id = urlParams.get("session_id") || "None";
    const study_id = urlParams.get("study_id") || "None";
    const participant_id = urlParams.get("participant_id") || "None";
    const api_key = urlParams.get("api_key") || "None";

    // echo all URL params for debugging
    const entries = urlParams.entries();
    for (const entry of entries) {
      console.log(`${entry[0]}: ${entry[1]}`);
    }

    return {
      session_id,
      study_id,
      participant_id,
      api_key,
    };
  }

  /**
   * Adds key URL params to the trial data
   * @param {*} trials
   * @param {SessionParams} sessionParams
   */
  static addSessionParamsToTrials(trials, sessionParams) {
    for (let i = 0; i < trials.length; i++) {
      trials[i] = {
        ...trials[i],
        ...sessionParams,
      };
    }
  }

  /**
   * Adds schema for URL params to the data schema
   * @param {*} dataSchema
   */
  static addSessionParamsToDataSchema(dataSchema) {
    dataSchema.$defs.trial.properties = {
      ...dataSchema.$defs.trial.properties,
      participant_id: {
        type: "string",
        description:
          "unique identifier for the participant, provided in the query string",
      },
      session_id: {
        type: "string",
        description:
          "unique identifier for the session, provided in the query string",
      },
      study_id: {
        type: "string",
        description:
          "unique identifier for the study, provided in the query string",
      },
      api_key: {
        type: "string",
        description:
          "unique identifier for the study api_key, provided in the query string",
      },
    };
  }

  /**
   * Uploads data to endpoint
   * @param { import('./lib/m2c2kit.core.esm.min').ActivityResultsEvent } ev
   * @param {SessionParams} sessionParams
   */
  static uploadData(ev, sessionParams) {
    console.log("Upload script loaded ...");

    // save trial level data to extract values
    const trials = ev.data;
    const metadata = {};
    // const schema = ev.schema;
    // create new object with only ev.data, ev.dataSchema, ev.activityConfiguration
    const api_url = "https://api.contextlab.daytah.io/upload";
    const data = {
      data_json: JSON.stringify(ev.data),
      //content: JSON.stringify(ev.data),
      study_uid: sessionParams.study_id,
      session_uid: sessionParams.session_id,
      user_uid: sessionParams.participant_id,
      api_key: sessionParams.api_key,
      activity_uid: sessionParams.study_id + "_" + Uuid.generate(),
      activity_name: ev.target.name,
      activity_version: "0.0.0",
      activity_url: "url",
      activity_engine: "m2c2kit-mountpoints",
      activity_engine_version: "0.0.1",
      activity_schema: JSON.stringify(ev.dataSchema),
      event_type: ev.type,
      metadata: JSON.stringify(ev.activityConfiguration),
    };
    console.log(JSON.stringify(data));

    fetch("/upload", {
      method: "POST", // or 'PUT'?
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        /**
         * fetch does not throw an error on 4xx or 5xx responses!
         * So we must reject manually.
         */
        return Promise.reject(response);
      })
      .then((data) => {
        console.log("Success:", data);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }
}
