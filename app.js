require("dotenv").config();

const path = require("path");
const express = require("express");
const connectDB = require("./database");
const passport = require("passport");
const cors = require("cors");
const { localStrategy, jwtStrategy } = require("./passport");

const formsRoutes = require("./apis/forms/forms.routes");
const usersRouter = require("./apis/users/users.routes");
const notificationsRouter = require("./apis/notifications/notifications.routes");
const formSubmitions = require("./apis/formSubmitions/formSubmitions.routes");
const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());
app.use(passport.initialize());
passport.use(localStrategy);
passport.use(jwtStrategy);

app.use("/forms", formsRoutes);
app.use("/users", usersRouter);
app.use("/notifications", notificationsRouter);
app.use("/formSubmitions", formSubmitions);
app.use("/media", express.static(path.join(__dirname, "media")));
connectDB();

app.listen(PORT, () => {
  console.log(`The application is running on localhost:${PORT}`);
});
