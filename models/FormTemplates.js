const { model, Schema } = require("mongoose");

const FormTemplatesSchema = new Schema({
   formName: {
    type: String,
    required: true,
    unique: true
  },
  score: {
    type: String,
    enum: ['SCORE', 'OTHER', ''],
    default: ''
  },
  scaleDescription: {
    type: String,
    required: function() {
      return this.score === 'SCORE' || this.score === 'OTHER';
    }
  },
  fieldTemplates: [
    {
      type: Schema.Types.ObjectId,
      ref: "FieldTemplates",
    },
  ],
});

module.exports = model("FormTemplates", FormTemplatesSchema);