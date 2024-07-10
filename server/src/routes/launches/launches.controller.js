const {
  getAllLaunches,
  scheduleNewLaunch,
  existsLaunchWithId,
  abortLaunchById,
} = require("../../models/launches.model");
const { getPagination } = require("../../services/query");

async function httpGetAllLaunches(req, res) {
  const { skip, limit } = getPagination(req.query);
  const launches = await getAllLaunches(skip, limit);
  return res.status(200).json(launches);
}
async function httpAddNewLaunch(req, res) {
  const launch = req.body;
  if (!launch.mission || !launch.rocket || !launch.launchDate || !launch.target) {
    return res.status(400).json({ error: "Missing required launch property" });
  }
  launch.launchDate = new Date(launch.launchDate);
  if (launch.launchDate.toString() === "Invalid Date") {
    //OR  if (isNaN(launch.launchDate)) {}
    //isNaN(launch.launchDate) returns false if  it's a date
    //isNaN() if we passed an object to it, it will apply for example isNaN(object.valueOf()) to check if it's a number

    return res.status(400).json({ error: "Invalid launch date" });
  }
  await scheduleNewLaunch(launch);
  return res.status(201).json(launch);
}
async function httpAbortLaunch(req, res) {
  const launchId = Number(req.params.id);
  const existsLaunch = await existsLaunchWithId(launchId);
  if (!existsLaunch) {
    return res.status(404).json({ error: "Launch Not Found!" });
  }
  const aborted = await abortLaunchById(launchId);
  if (!aborted) {
    return res.status(400).json({ error: "Launch not aborted!" });
  }
  res.status(200).json({ ok: true });
}
module.exports = {
  httpGetAllLaunches,
  httpAddNewLaunch,
  httpAbortLaunch,
};
