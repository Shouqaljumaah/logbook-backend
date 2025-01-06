const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://kuw1992:Wts1TBZOvizAzNMJ@cluster0.y5iri.mongodb.net/");
    console.log("Connected to DB!!");
  } catch (error) {
    console.error("Error trying to connect to DB!", error);
  }
};

module.exports = connectDB;
