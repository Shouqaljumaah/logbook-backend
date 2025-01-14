const { model, Schema, Types } = require("mongoose");

const FormTemplatesSchema = new Schema({
  name: {
    type: String,
  },
  scaleDescription: {
    type: String,
  },

  fieldTemplates: [
    {
      type: Schema.Types.ObjectId,
      ref: "FieldTemplates",
    },
  ],
});


module.exports = model("FormTemplates", FormTemplatesSchema);
