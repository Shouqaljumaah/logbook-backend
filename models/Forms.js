const { model, Schema, Types } = require("mongoose");
const formSchema = new Schema({
  name: {
    type: String,
  },
   fields:[ref],
});

module.exports = model("Forms", formSchema);
