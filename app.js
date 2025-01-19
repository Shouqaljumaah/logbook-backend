require("dotenv").config();

const path = require("path");
const express = require("express");
const connectDB = require("./database");
const passport = require("passport");
const cors = require("cors");

const { localStrategy, jwtStrategy } = require("./passport");
const formTemplatesRouter = require("./apis/formTamplates/formTemplates.routes");
const usersRouter = require("./apis/users/users.routes");
const notificationsRouter = require("./apis/notifications/notifications.routes");
const formSubmitionsRouter = require("./apis/formSubmitions/formSubmitions.routes");
const announcementsRouter = require("./apis/announcements/announcements.routes");
const fieldTemplateRouter = require("./apis/fieldTemplate/routes");
const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());
app.use(passport.initialize());
passport.use(localStrategy);
passport.use(jwtStrategy);

app.use("/fieldTemplate", fieldTemplateRouter)
app.use("/formTemplates", formTemplatesRouter);
app.use("/users", usersRouter);
app.use("/notifications", notificationsRouter);
app.use("/formSubmitions", formSubmitionsRouter);
app.use("/announcements", announcementsRouter);
app.use("/media", express.static(path.join(__dirname, "media")));
app.use('/api/users', require('./apis/users/users.routes'));// changes done here 
connectDB();

app.listen(PORT, () => {
  console.log(`The application is running on localhost:${PORT}`);
});