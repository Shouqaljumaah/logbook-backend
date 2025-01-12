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
  //"User validation failed: role: `resident` is not a valid enum value for path `role`." this message shows when i put guests instead of tutor resident
  role: { type: String, enum: ["admin", "tutor", "resident"] }, // resident or tutor or admin
  isFirstLogin: { type: Boolean, default: true },
});
module.exports = model("User", UserSchema);
