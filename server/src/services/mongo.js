const mongoose = require("mongoose");

require("dotenv").config(); //To ensure that our tests know the URL of our Mongo database

const MONGO_URL = process.env.MONGO_URL;

mongoose.connection.on("open", () => {
  console.log("MongoDB connection ready!");
});
mongoose.connection.on("error", (err) => {
  console.error(err);
});

async function mongoConnect() {
  await mongoose.connect(MONGO_URL);
}
async function mongoDisconnect() {
  await mongoose.disconnect();
}

module.exports = {
  mongoConnect,
  mongoDisconnect,
};
