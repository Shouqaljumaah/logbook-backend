const { model, Schema, Types } = require("mongoose");
const { response } = require("express");
const { options } = require("../apis/forms/forms.routes");

const FieldTemplatesSchema = new Schema({
  name: {
    type: String,
  },
  scaleOptions: [{ type: String }],

  form: {
    type: Schema.Types.ObjectId,
    ref: "FormTemplates",
  },

  position: {
    type: String,
  },
  response: {
    type: String,
  },
  type: {
    type: String,
  },
});

module.exports = model("FieldTemplates", FieldTemplatesSchema);
