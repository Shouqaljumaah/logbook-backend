
const FieldTemplates = require("../../models/FieldTemplates");
const FormTemplatesSchema = require("../../models/FormTemplates");

exports.getForms = async (req, res) => {
  const forms = await FormTemplatesSchema.find().populate("fieldTemplates");
  return res.json(forms);
};

exports.getForm = async (req, res) => {
  const form = await FormTemplatesSchema.findById(req.params.id);
  res.json(form);
};

exports.deleteForm = async (req, res) => {
  try {
    await FormTemplatesSchema.deleteOne({ _id: req.params.id });
    res.status(204).end();
  } catch (err) {
    return res.status(404).json({ message: "e" });
  }
};

exports.updateForm = async (req, res) => {
  const { formId } = req.params;
  try {
    const foundForm = await FormTemplatesSchema.findById(formId);
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






exports.createFormTemplate = async (req, res) => {
  try {
    const newFormsTemplate = await FormTemplatesSchema.create({ name: req.body.name });
    const fieldTemplates = req.body.fieldTemplates;
    const createdFieldTemplate = [];

    // Create each field and store references
    for (const fieldTemplate of fieldTemplates) {
      const newFieldTemplate = await FieldTemplates.create({ ...fieldTemplate, formTemplate: newFormsTemplate._id });
     
      createdFieldTemplate.push(newFieldTemplate._id);
    }
    // Add field references to the form
     await FormTemplatesSchema.findByIdAndUpdate(newFormsTemplate._id, {
      $push: { fieldTemplates: { $each: createdFieldTemplate } },
    });
    res.status(201).json(newFormsTemplate);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};


