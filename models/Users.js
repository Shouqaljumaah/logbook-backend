const { model, Schema } = require("mongoose");

const UserSchema = new Schema({
  username: {
    type: String,
    unique: true,
  },
  typ: {
    type: String,
    default: "USER",
  },
  password: { type: String },
  image: { type: String },
});
module.exports = model("User", UserSchema);
