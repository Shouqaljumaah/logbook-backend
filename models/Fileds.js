const { model, Schema, Types } = require("mongoose");
const FailedsSchema = require("./Fildes");
const { response } = require("express");
const { options } = require("../apis/forms/forms.routes");

const FildesSchema = new Schema({
  name: {
    type: String,
  },
  scaleOptions: [{ type: String }],

  form: {
    type: Schema.Types.ObjectId,
    ref: "Forms",
  },

  position: {
    type: String,
  },
  response: {
    type: String,
  },
});

module.exports = model("Filds", FildesSchema);
