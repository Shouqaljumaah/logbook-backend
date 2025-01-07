const { model, Schema, Types } = require("mongoose");
const FormsSubmitionsSchema = new Schema({
  recods: [
    {
      type: Schema.Types.ObjectId,
      ref: "Records",
    },
  ],

  form: {
    type: Schema.Types.ObjectId,
    ref: "Forms",
  },
  resident: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  tutor: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = model("FormSubmitions", FormsSubmitionsSchema);
