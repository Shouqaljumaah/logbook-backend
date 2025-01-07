const { model, Schema } = require("mongoose");
const type = require("mongoose/lib/schema/operators/type");

const UserSchema = new Schema({
  username: {
    type: String,
    unique: true,
  },
  password: { type: String },
  image: { type: String },
  role: { type: String, enum: ["admin", "guest"] }, // resident or tutor or admin
});
module.exports = model("User", UserSchema);
