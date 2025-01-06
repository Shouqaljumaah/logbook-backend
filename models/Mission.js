const { model, Schema, Types } = require("mongoose");
const missionSchema = new Schema({
  template:[ref],
   record:[ref],
});

module.exports = model("Missions", missionSchema);
