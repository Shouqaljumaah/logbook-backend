const { model, Schema, Types } = require("mongoose");
const { response } = require("express");

const FieldTemplatesSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  hasDetails: {
    type: Boolean,
    default: false
  },
  details: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    required: true,
    enum: ['text', 'select', 'scale', 'date', 'textArea' ] // Define allowed types
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
  options: [{ type: String }],
  

});

module.exports = model("FieldTemplates", FieldTemplatesSchema);
