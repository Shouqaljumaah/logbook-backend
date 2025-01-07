const Fileds = require("../../models/Fileds");
const Forms = require("../../models/Forms");

exports.getForms = async (req, res) => {
  const forms = await Forms.find().populate("fields");
  return res.json(forms);
};

exports.getForm = async (req, res) => {
  const form = await Forms.findById(req.params.id);
  res.json(form);
};

exports.deleteForm = async (req, res) => {
  try {
    await Forms.deleteOne({ _id: req.params.id });
    res.status(204).end();
  } catch (err) {
    return res.status(404).json({ message: "e" });
  }
};
exports.updateForm = async (req, res) => {
  const { formId } = req.params;
  try {
    const foundForm = await Forms.findById(formId);
    if (foundForm) {
      await foundForm.updateOne(req.body);
      res.status(200).json({ message: "Form Updated Successfully" });
    } else {
      res.status(404).json({ message: "Form Not Found" });
    }
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.createForm = async (req, res) => {
  try {
    const newForms = await Forms.create({ name: req.body.name });
    const fields = req.body.fields;
    const createdFields = [];

    // Create each field and store references
    for (const field of fields) {
      const newField = await Fileds.create({ ...field, form: newForms._id });
      createdFields.push(newField._id);
    }

    // Add field references to the form
    await Forms.findByIdAndUpdate(newForms._id, {
      $push: { fields: { $each: createdFields } },
    });

    res.status(201).json(newForms);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
