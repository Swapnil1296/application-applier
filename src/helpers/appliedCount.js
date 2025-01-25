const fs = require("fs").promises;
const path = require("path");
const logger = require("../utils/logger");

const APPLICATION_TRACKER_FILE = path.join(
  __dirname,
  "job_application_tracker.json"
);

async function getApplicationCount() {
  try {
    const data = await fs.readFile(APPLICATION_TRACKER_FILE, "utf8");
    return JSON.parse(data).successfullyApplied || 0;
  } catch (error) {
    // If file doesn't exist, return 0
    if (error.code === "ENOENT") {
      return 0;
    }
    throw error;
  }
}

async function updateApplicationCount(newApplications) {
  try {
    // Read existing data or start with 0
    let trackerData = { successfullyApplied: 0 };

    try {
      const existingData = await fs.readFile(APPLICATION_TRACKER_FILE, "utf8");
      trackerData = JSON.parse(existingData);
    } catch (readError) {
      if (readError.code !== "ENOENT") {
        throw readError;
      }
    }

    // Update count
    trackerData.successfullyApplied += newApplications;

    // Write updated data
    await fs.writeFile(
      APPLICATION_TRACKER_FILE,
      JSON.stringify(trackerData, null, 2)
    );
    logger.info(
      "\n====>Total Job Applied Till Now====> ",
      trackerData?.successfullyApplied
    );
    return trackerData?.successfullyApplied;
  } catch (error) {
    console.error("Error updating application count:", error);
    throw error;
  }
}

module.exports = {
  updateApplicationCount,
  getApplicationCount,
};
