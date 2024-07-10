const Launch = require("./launches.mongo");
const Planet = require("./planets.mongo");
const axios = require("axios");

const DEFAULT_FLIGHT_NUMBER = 100;

const SPACEX_API_URL = "https://api.spacexdata.com/v4/launches/query";
async function populateLaunches() {
  console.log("Downloading launches data...");

  const response = await axios.post(SPACEX_API_URL, {
    query: {},
    options: {
      pagination: false,
      populate: [
        {
          path: "rocket",
          select: {
            name: 1,
          },
        },
        {
          path: "payloads",
          select: {
            customers: 1,
          },
        },
      ],
    },
  });
  if (response.status !== 200) {
    console.log("Problem downloading launch data");
    throw new Error("Launch data download failed");
  }
  const launchDocs = response.data.docs;
  for (const launchDoc of launchDocs) {
    const payloads = launchDoc["payloads"]; //array of arrays
    const customers = payloads.flatMap((payload) => {
      return payload["customers"];
    });

    const launch = {
      flightNumber: launchDoc["flight_number"],
      mission: launchDoc["name"],
      rocket: launchDoc["rocket"]["name"],
      launchDate: launchDoc["date_local"],
      customers,
      upcoming: launchDoc["upcoming"],
      success: launchDoc["success"],
    };
    console.log(`${launch.flightNumber} ${launch.mission}`);
    await saveLaunch(launch);
  }
}

async function loadLaunchData() {
  const firstLaunch = await findLaunch({
    flightNumber: 1,
    rocket: "Falcon 1",
    mission: "FalconSat",
  });
  if (firstLaunch) {
    console.log("Launch Data already loaded!");
  } else {
    await populateLaunches();
  }
}

async function findLaunch(filter) {
  return await Launch.findOne(filter);
}
async function existsLaunchWithId(launchId) {
  return await findLaunch({ flightNumber: launchId });
}

async function getLatestFlightNumber() {
  const lastestLaunch = await Launch.findOne({}).sort("-flightNumber");
  //passing in the property to sort() will sort the documents in an ascending order
  //adding - to infront of the property will sort in decending order
  if (!lastestLaunch) {
    return DEFAULT_FLIGHT_NUMBER;
  }
  return lastestLaunch.flightNumber;
}

async function getAllLaunches(skip, limit) {
  return await Launch.find({}, { __v: 0, _id: 0 })
    .sort({ flightNumber: 1 }) //sorting the returned docs by their flightNumber (-1 = deacending) (1 = acending)
    .skip(skip) //skips over the first (10 for example) documents
    .limit(limit); //limits the amount of documents that come back from mongo
}
async function saveLaunch(launch) {
  await Launch.findOneAndUpdate({ flightNumber: launch.flightNumber }, launch, {
    upsert: true,
  });
}

async function scheduleNewLaunch(launch) {
  const planet = await Planet.findOne({ keplerName: launch.target });
  if (!planet) {
    throw new Error("No matching planet was found!");
  }
  const newFlightNumber = (await getLatestFlightNumber()) + 1;
  const newLaunch = Object.assign(launch, {
    success: true,
    upcoming: true,
    customers: ["Zero To  Mastery", "NASA"],
    flightNumber: newFlightNumber,
  });
  await saveLaunch(newLaunch);
}

async function abortLaunchById(launchId) {
  const aborted = await Launch.updateOne(
    { flightNumber: launchId },
    { success: false, upcoming: false }
  );

  return aborted.modifiedCount === 1;
}

module.exports = {
  loadLaunchData,
  existsLaunchWithId,
  getAllLaunches,
  abortLaunchById,
  scheduleNewLaunch,
};
