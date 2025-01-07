const { model, Schema, Types } = require("mongoose");
const Forms = require("./Forms");

const CategoriesSchema = new Schema({
  title: {
    type: String,
  },
  image: {
    type: String,
  },
  form: [
    {
      type: Schema.Types.ObjectId,
      ref: "Forms",
    },
  ],
});

module.exports = model("Categories", CategoriesSchema);
