const { model, Schema, Types } = require("mongoose");


const templateSchema = new Schema({
  name: {
    type: String,
  },
  fields:[ref],
});

module.exports = model("Template", templateSchema);
z