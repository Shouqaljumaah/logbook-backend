const { model, Schema, Types } = require("mongoose");
const { response } = require("express");

const FieldTemplatesSchema = new Schema({
  name: {
    type: String,
  },
  scaleOptions: [{ type: String }],

  formTemplate: {
    type: Schema.Types.ObjectId,
    ref: "FormTemplates",
  },

  position: {
    type: String,
  },
  response: {
    type: String,
  },
  section: {
    type: String, // 1-10
  },
});

module.exports = model("FieldTemplates", FieldTemplatesSchema);
