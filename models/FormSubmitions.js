const mongoose = require('mongoose');

const formSubmitionSchema = new mongoose.Schema({
  formtemplate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FormTemplate',
    required: true
  },
  resident: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  submissionDate: {
    type: Date,
    required: true
  },
  fieldRecord: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FieldRecord'
  }],
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'approved', 'rejected'],
    default: 'pending'
  }
});

module.exports = mongoose.model('FormSubmition', formSubmitionSchema);
