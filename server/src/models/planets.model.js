const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse");

const Planet = require("./planets.mongo");

function isHabitablePlanet(planet) {
  return (
    planet["koi_disposition"] === "CONFIRMED" &&
    planet["koi_insol"] > 0.36 &&
    planet["koi_insol"] < 1.11 &&
    planet["koi_prad"] < 1.6
  );
}
function loadPlanetsData() {
  return new Promise((resolve, reject) => {
    fs.createReadStream(path.join(__dirname, "..", "..", "data", "kepler_data.csv"))
      .pipe(
        parse({
          comment: "#",
          columns: true, //this will return each row in our  csv file as a JS object with key-value pairs rather than an array of values
        })
      )
      .on("data", async (data) => {
        if (isHabitablePlanet(data)) {
          // habitablePlanets.push(data);
          //approach 1
          // const habitablePlanet = new Planet({ keplerName: data });
          // await habitablePlanet.save();
          //approach 2
          //insert + update = upsert
          await savePlanet(data);
        }
      })
      .on("error", (error) => {
        console.log(error);
        reject(error);
      })
      .on("end", async () => {
        const countPlanetsFound = (await getAllPlanets()).length;
        console.log(`${countPlanetsFound} habitable plantes found!`);
        resolve();
      });
  });
}
async function getAllPlanets() {
  return await Planet.find({}, "-_id -__v");
  //or another way of projection
  return await Planet.find({}, { __v: 0, _id: 0 });
}
async function savePlanet(planet) {
  try {
    await Planet.updateOne(
      { keplerName: planet.kepler_name },
      { keplerName: planet.kepler_name },
      { upsert: true }
    );
  } catch (error) {
    console.error(`Could not save planet ${error}`);
  }
}
module.exports = {
  loadPlanetsData,
  getAllPlanets,
};
