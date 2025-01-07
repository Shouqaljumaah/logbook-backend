const { model, Schema, Types } = require("mongoose");
const formSchema = new Schema({
  name: {
    type: String,
  },

  fields: [
    {
      type: Schema.Types.ObjectId,
      ref: "Fields",
    },
  ],
});

module.exports = model("Forms", formSchema);
