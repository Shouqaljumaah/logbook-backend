const { model, Schema } = require("mongoose");
const type = require("mongoose/lib/schema/operators/type");

const UserSchema = new Schema({
  username: {
    type: String,
    unique: true,
  },
  password: { type: String },
  image: { type: String },
  email: { type: String },
  phone: { type: String },
  level: { type: String },
  roles: [
    {
      type: String,
      enum: ["superadmin", "admin", "tutor", "resident"],
    },
  ], // superadmin: platform admin, admin: institution admin, tutor/resident: regular users
  isFirstLogin: { type: Boolean, default: true },
  supervisor: { type: Schema.Types.ObjectId, ref: "User" },
  institutions: [
    {
      type: Schema.Types.ObjectId,
      ref: "Institution",
    },
  ], // Institutions the user belongs to/joined (tutors and residents can join multiple)
  isSuperAdmin: { type: Boolean, default: false }, // Flag for super admin (platform admin) access
  isDeleted: { type: Boolean, default: false }, // Soft delete flag
  deletedAt: { type: Date, default: null }, // When the account was deleted
  // adminOf: institutions where this user is admin (determined by role + institutions array)
});

module.exports = model("User", UserSchema);
