const { model, Schema, Types } = require("mongoose");
const RecordsSchema = new Schema({
  value: {
    type: String,

    filed: {
      type: Schema.Types.ObjectId,
      ref: "Fildes",
    },
  },
});

module.exports = model("Records", RecordsSchema);
