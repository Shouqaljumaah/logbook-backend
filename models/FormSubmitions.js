const { model, Schema, Types } = require("mongoose");
const FormsSubmitionsSchema = new Schema({
  recod: {
    type: Schema.Types.ObjectId,
    ref: "Records",
  },

  form: {
    type: Schema.Types.ObjectId,
    ref: "Forms",
  },
});

module.exports = model("FormSubmitions", FormsSubmitionsSchema);
