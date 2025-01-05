const Categories = require("../../models/Categories");
const Forms = require("../../models/Forms");

exports.getForms = async (req, res) => {
  const forms = await Formss.find().populate("category");
  return res.json(forms);
};

exports.getForms = async (req, res) => {
  const form = await Forms.findById(req.params.id);
  res.json(form);
};

exports.deleteForm = async (req, res) => {
  try {
    await Recipes.deleteOne({ _id: req.params.id });
    res.status(204).end();
  } catch (err) {
    return res.status(404).json({ message: "error" });
  }
};
exports.updateForm = async (req, res) => {
  const { formId } = req.params;
  try {
    const foundForm = await Forms.findById(formId);
    if (foundForm) {
      await foundForm.updateOne(req.body);
      res.status(200).json({ message: "form Updated Successfully" });
    } else {
      res.status(404).json({ message: "form not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createForm = async (req, res) => {
  try {
    const newForms = await Forms.create(req.body);
    res.status(201).json(newForms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
