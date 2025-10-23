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
  roles: [
    {
      type: String,
      enum: ["admin", "tutor", "resident"],
    },
  ], // Change from single role to array of roles
  isFirstLogin: { type: Boolean, default: true },
  supervisor: { type: Schema.Types.ObjectId, ref: "User" },
});

module.exports = model("User", UserSchema);
