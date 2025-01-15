const { model, Schema, Types } = require("mongoose");

const FormTemplatesSchema = new Schema({
   formName: {
    type: String,
    required: true,
  },
  score: {
    type: String, 
    optional: true,
    enum: ['SCORE']
  },
  scaleDescription: {
    type: String,
    optional: true
  },

  fieldTemplates: [
    {
      type: Schema.Types.ObjectId,
      ref: "FieldTemplates",
    },
  ],
});


module.exports = model("FormTemplates", FormTemplatesSchema);
