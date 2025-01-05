const { model, Schema, Types } = require("mongoose");
const recipeSchema = new Schema({
  title: {
    type: String,
  },
  image: {
    type: String,

    category: {
      type: Schema.Types.ObjectId,
      ref: "Categories",
    },
  },
});

module.exports = model("Forms", formSchema);
