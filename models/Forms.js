const { model, Schema, Types } = require("mongoose");
const formSchema = new Schema({
  name: {
    type: String,
  },

  filed: {
    type: Schema.Types.ObjectId,
    ref: "Fileds",
  },
});

module.exports = model("Forms", formSchema);
