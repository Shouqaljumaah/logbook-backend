const { model, Schema, Types } = require("mongoose");
const FormsSubmitionsSchema = new Schema(
  {
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

    status: {
      type: String,
      default: "pending",
      enum: ["pending", "completed", "rejected"], // Define allowed types
    },

    // Tutor assessment of the submission
    // Options are defined in constants/assessmentOptions.js and can be changed without rebuilding
    assessment: {
      type: String,
      default: null,
    },

    // Assessment comments/feedback from tutor
    assessmentComments: {
      type: String,
      default: null,
    },

    // Date when assessment was completed
    assessedAt: {
      type: Date,
      default: null,
    },

    // Tutor who assessed the submission
    assessedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    institution: {
      type: Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = model("FormSubmitions", FormsSubmitionsSchema);
