const { model, Schema, Types } = require("mongoose");




const recordSchema = new Schema({
  name: {
    type: String,
  },
  field:[ref],
  value:[String],
   //owner:[resi],

});

module.exports = model("Record", recordSchema);
