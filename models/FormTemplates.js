const { model, Schema } = require("mongoose");

const FormTemplatesSchema = new Schema({
  formName: {
    type: String,
    required: true,
  },
  score: {
    type: String,
    enum: ["SCORE", "OTHER", ""],
    default: "",
  },
  scaleDescription: {
    type: String,
    required: function () {
      return this.score === "SCORE" || this.score === "OTHER";
    },
  },
  fieldTemplates: [
    {
      type: Schema.Types.ObjectId,
      ref: "FieldTemplates",
    },
  ],
  institution: {
    type: Schema.Types.ObjectId,
    ref: "Institution",
    required: true,
  },
});

// Compound index to ensure formName is unique within an institution
FormTemplatesSchema.index({ formName: 1, institution: 1 }, { unique: true });

module.exports = model("FormTemplates", FormTemplatesSchema);
