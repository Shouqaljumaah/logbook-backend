const FieldTemplates = require("../../models/FieldTemplates");
const FormTemplatesSchema = require("../../models/FormTemplates");

exports.getForms = async (req, res) => {
  try {
    const forms = await FormTemplatesSchema.find().populate("fieldTemplates");
    // console.log('Found forms:', forms); // Debug log
    return res.json(forms);
  } catch (error) {
    console.error('Error getting forms:', error);
    return res.status(500).json({ message: error.message });
  }
};

exports.getForm = async (req, res) => {
  const form = await FormTemplatesSchema.findById(req.params.id).populate("fieldTemplates");
  res.json(form);
};

exports.deleteForm = async (req, res) => {
  try {
    const { formId } = req.params;
    
    console.log('Attempting to delete form:', formId); // Debug log

    // Find and delete the form
    const deletedForm = await FormTemplatesSchema.findByIdAndDelete(formId);

    if (!deletedForm) {
      console.log('Form not found:', formId); // Debug log
      return res.status(404).json({ message: "Form not found" });
    }

    // Also delete associated field templates
    await FieldTemplates.deleteMany({ formTemplate: formId });

    console.log('Form deleted successfully:', formId); // Debug log
    res.status(200).json({ 
      message: "Form deleted successfully",
      deletedForm 
    });

  } catch (err) {
    console.error('Delete form error:', err);
    res.status(500).json({ 
      message: "Failed to delete form",
      error: err.message 
    });
  }
};

exports.updateForm = async (req, res) => {
  const { formId } = req.params;
  try {
    const {formName, score, scaleDescription, fieldTemplates } = req.body;

    // Find and update the form
    const form = await FormTemplatesSchema.findById(formId);
    if (!form) {
      return res.status(404).json({ message: "Form Not Found" });
    }

    // Update form fields
    form.formName = formName;
    form.score = score;
    form.scaleDescription = scaleDescription;

    // Update or create field templates
    for (const field of fieldTemplates) {
      if (field._id) {
        await FieldTemplates.findByIdAndUpdate(field._id, {
          name: field.name,
          position: field.position,
          response: field.response,
          section: field.section,
          options: field.options,
          hasDetails: field.hasDetails,
          details: field.details,
          scaleOptions: field.scaleOptions,
          type: field.type
        });
      } else {
        const newField = await FieldTemplates.create({
          ...field,
          formTemplate: formId
        });
        form.fieldTemplates.push(newField._id);
      }
    }

    // Save the updated form
    await form.save();

    // Return the updated form with populated fields
    const updatedForm = await FormTemplatesSchema.findById(formId).populate('fieldTemplates');
    res.status(200).json(updatedForm);

  } catch (err) {
    console.error('Update form error:', err);
    res.status(500).json({ 
      message: "Failed to update form",
      error: err.message 
    });
  }
};






exports.createFormTemplate = async (req, res) => {
  try {
    // Create form with scaleDescription
    const newFormsTemplate = await FormTemplatesSchema.create({ 
      formName: req.body.formName,
      score: req.body.score,
      scaleDescription: req.body.scaleDescription
    });
    const fieldTemplates = req.body.fieldTemplates;
    const createdFieldTemplate = [];

    // Create each field and store references
    for (const fieldTemplate of fieldTemplates) {
      const newFieldTemplate = await FieldTemplates.create({ 
        ...fieldTemplate, 
        formTemplate: newFormsTemplate._id,
        options: (fieldTemplate.type === 'select' || fieldTemplate.type === 'checkbox') 
          ? fieldTemplate.options || [] 
          : [], // Save options for both select and checkbox
        scaleOptions: fieldTemplate.type === 'scale' ? fieldTemplate.scaleOptions || [] : [],
        selectedOptions: fieldTemplate.type === 'checkbox' ? [] : undefined // Initialize empty selected options for checkboxes
      });
     
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