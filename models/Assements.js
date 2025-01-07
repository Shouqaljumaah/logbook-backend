const { model, Schema, Types } = require("mongoose");
const AssimentsSchemas = require("./Assements");

const AssimentsSchema = new Schema({
  question: {
    type: String,
  },
  scale: {
    type: Array,
  },
  form: [
    {
      type: Schema.Types.ObjectId,
      ref: "Forms",
    },
  ],
});

module.exports = model("Assements", AssimentsSchemas);
