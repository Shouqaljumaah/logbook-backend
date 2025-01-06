require("dotenv").config();

const path = require("path");
const express = require("express");
const connectDB = require("./database");
const passport = require("passport");
const cors = require("cors");
const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());
app.use(passport.initialize());
passport.use(localStrategy);
passport.use(jwtStrategy);

app.use("/categaries", categariesRoutes);
app.use("/forms", formsRoutes);
app.use("/users", usersRouter);
app.use("/media", express.static(path.join(__dirname, "media")));
connectDB();

app.listen(PORT, () => {
  console.log(`The application is running on localhost:${PORT}`);
});
