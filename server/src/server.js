const http = require("http");
const app = require("./app");

require("dotenv").config();

const { loadPlanetsData } = require("./models/planets.model");
const { mongoConnect } = require("./services/mongo");
const { loadLaunchData } = require("./models/launches.model");

const PORT = process.env.PORT || 8000;

const server = http.createServer(app); //it provides additional flexibilty

async function startServer() {
  await mongoConnect();
  await loadPlanetsData();
  await loadLaunchData();
  server.listen(PORT, () => {
    console.log(`Litening on port ${PORT}...`);
  });
}
startServer();
//My approche
// loadPlanetsData().then(() => {
//   server.listen(PORT, () => {
//     console.log(`Litening on port ${PORT}...`);
//   });
// });
console.log(PORT);
