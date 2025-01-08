const { model, Schema, Types } = require("mongoose");
const FormTemplatesSchema = new Schema({
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

module.exports = model("FormTemplates", FormTemplatesSchema);
