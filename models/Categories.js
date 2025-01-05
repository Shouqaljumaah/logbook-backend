const { model, Schema, Types } = require("mongoose");
const Recipes = require("./Forms");

const CategoriesSchema = new Schema({
  title: {
    type: String,
  },
  image: {
    type: String,
  },
  forms: [
    {
      type: Schema.Types.ObjectId,
      ref: "Forms",
    },
  ],
});

module.exports = model("Categories", CategoriesSchema);
