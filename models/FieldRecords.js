const { model, Schema, Types } = require("mongoose");

const fieldRecordsSchema = new Schema({
  value: {
    type: String,},

    fieldTemplate: {
      type: Schema.Types.ObjectId,
      ref: "FieldTemplates",
    },
    fieldName: {
      type: String,
    },

  
});

module.exports = model("FieldRecords", fieldRecordsSchema);