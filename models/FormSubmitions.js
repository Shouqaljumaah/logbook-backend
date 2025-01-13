const { model, Schema, Types } = require("mongoose");
const FormsSubmitionsSchema = new Schema({
  fieldRecord: [
    {
      type: Schema.Types.ObjectId,
      ref: "FieldRecords",
    },
  ],

  formTemplate: {
    type: Schema.Types.ObjectId,
    ref: "FormTemplates",
  },
  resident: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  tutor: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = model("FormSubmitions", FormsSubmitionsSchema);
