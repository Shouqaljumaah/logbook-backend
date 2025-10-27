const { model, Schema } = require("mongoose");

const InstitutionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    logo: {
      type: String,
    },
    contactEmail: {
      type: String,
      trim: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Institution admin(s) - users with admin role for this institution
    admins: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    settings: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = model("Institution", InstitutionSchema);
