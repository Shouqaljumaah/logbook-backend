const { model, Schema, Types } = require("mongoose");
const { options } = require("../apis/forms/forms.routes");


const fieldSchema = new Schema({
  name: {
    type: String,
  },
  form:[ref],
  scale:[String],
   options

});

module.exports = model("Fields", fieldSchema);
