const FormSubmitions = require("../../models/FormSubmitions");

exports.getAllFormSubmitions = async (req, res) => {
  const formSubmitions = await FormSubmitions.find();
  return res.json(formSubmitions);
};

exports.getFormSubmitions = async (req, res) => {
  const formSubmitions = await FormSubmitions.findById(req.params.id);
  res.json(formSubmitions);
};

exports.deleteFormSubmitions = async (req, res) => {
  try {
    await FormSubmitions.deleteOne({ _id: req.params.id });
    res.status(204).end();
  } catch (err) {
    return res.status(404).json({ message: "e" });
  }
};
exports.updateFormSubmitions = async (req, res) => {
  const { formSubmitionsId } = req.params;
  try {
    const foundFormSubmitions = await Forms.findById(formSubmitionsId);
    if (foundFormSubmitions) {
      await foundForm.updateOne(req.body);
      res.status(200).json({ message: " Updated Successfully" });
    } else {
      res.status(404).json({ message: " Not Found" });
    }
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.createFormSubmitions = async (req, res) => {
  try {
    const newFormSubmitions = await Forms.create(req.body);
    res.status(201).json(newFormSubmitions);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
