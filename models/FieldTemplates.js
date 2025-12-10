const { model, Schema, Types } = require("mongoose");
const { response } = require("express");

const FieldTemplatesSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  hasDetails: {
    type: Boolean,
    default: false,
  },
  details: {
    type: String,
    default: "",
  },
  type: {
    type: String,
    required: true,
    enum: ["text", "select", "scale", "date", "textArea", "checkbox"], // Define allowed types
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
  // Level-restricted options for select/checkbox fields
  optionsWithLevels: [
    {
      value: { type: String, required: true },
      minLevel: {
        type: String,
        enum: ["R1", "R2", "R3", "R4", "R5", ""],
        default: "",
      },
      label: { type: String }, // Optional display label
    },
  ],
  hasLevelRestrictions: {
    type: Boolean,
    default: false, // True if field options have level restrictions
  },

  institution: {
    type: Schema.Types.ObjectId,
    ref: "Institution",
    required: true,
  },
});

module.exports = model("FieldTemplates", FieldTemplatesSchema);
