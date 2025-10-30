const FieldTemplates = require("../../models/FieldTemplates");
const FormTemplatesSchema = require("../../models/FormTemplates");
const User = require("../../models/Users");

exports.getForms = async (req, res) => {
  try {
    // Get the requesting user to determine institution access
    const requestingUser = await User.findById(req.user._id).populate(
      "institutions"
    );

    // Get optional institutionId from query parameter
    const { institutionId } = req.query;

    // Build query based on user's institutions and optional filter
    let query = {};

    if (requestingUser.isSuperAdmin) {
      // Super admin: can request specific institution or all
      if (institutionId) {
        query.institution = institutionId;
      }
      // If no institutionId, return all forms (no filter)
    } else {
      // Regular user: filter by their institutions
      const userInstitutionIds = requestingUser.institutions.map((inst) =>
        inst._id.toString()
      );

      if (institutionId) {
        // User requested specific institution - verify they have access
        if (!userInstitutionIds.includes(institutionId)) {
          return res.status(403).json({
            message: "You don't have access to this institution",
          });
        }
        query.institution = institutionId;
      } else {
        // No specific institution requested - return forms from all their institutions
        query.institution = { $in: userInstitutionIds };
      }
    }

    const forms = await FormTemplatesSchema.find(query)
      .populate("fieldTemplates")
      .populate("institution");

    return res.json(forms);
  } catch (error) {
    console.error("Error getting forms:", error);
    return res.status(500).json({ message: error.message });
  }
};

exports.getForm = async (req, res) => {
  try {
    const form = await FormTemplatesSchema.findById(req.params.id)
      .populate("fieldTemplates")
      .populate("institution");

    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    // Check if user has access to this form's institution
    const requestingUser = await User.findById(req.user._id).populate(
      "institutions"
    );
    if (!requestingUser.isSuperAdmin) {
      const hasAccess = requestingUser.institutions.some(
        (inst) => inst._id.toString() === form.institution._id.toString()
      );
      if (!hasAccess) {
        return res
          .status(403)
          .json({ message: "Access denied to this institution's forms" });
      }
    }

    res.json(form);
  } catch (error) {
    console.error("Error getting form:", error);
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteForm = async (req, res) => {
  try {
    const { formId } = req.params;

    console.log("Attempting to delete form:", formId); // Debug log

    // Find the form first to check permissions
    const form = await FormTemplatesSchema.findById(formId);
    if (!form) {
      console.log("Form not found:", formId); // Debug log
      return res.status(404).json({ message: "Form not found" });
    }

    // Verify user has permission to delete this form
    const requestingUser = await User.findById(req.user._id);

    if (!requestingUser.isSuperAdmin) {
      // Check if user is admin of the form's institution
      const Institution = require("../../models/Institutions");
      const institution = await Institution.findOne({
        _id: form.institution,
        admins: requestingUser._id,
      });

      if (!institution) {
        return res.status(403).json({
          message: "You don't have permission to delete this form",
        });
      }
    }

    // Delete the form
    const deletedForm = await FormTemplatesSchema.findByIdAndDelete(formId);

    // Also delete associated field templates
    await FieldTemplates.deleteMany({ formTemplate: formId });

    console.log("Form deleted successfully:", formId); // Debug log
    res.status(200).json({
      message: "Form deleted successfully",
      deletedForm,
    });
  } catch (err) {
    console.error("Delete form error:", err);
    res.status(500).json({
      message: "Failed to delete form",
      error: err.message,
    });
  }
};

exports.updateForm = async (req, res) => {
  const { formId } = req.params;
  try {
    const { formName, score, scaleDescription, fieldTemplates } = req.body;

    // Find and update the form
    const form = await FormTemplatesSchema.findById(formId).populate(
      "institution"
    );
    if (!form) {
      return res.status(404).json({ message: "Form Not Found" });
    }

    // Verify user has permission to update this form
    const requestingUser = await User.findById(req.user._id);

    if (!requestingUser.isSuperAdmin) {
      // Check if user is admin of the form's institution
      const Institution = require("../../models/Institutions");
      const institution = await Institution.findOne({
        _id: form.institution._id,
        admins: requestingUser._id,
      });

      if (!institution) {
        return res.status(403).json({
          message: "You don't have permission to update this form",
        });
      }
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
          type: field.type,
        });
      } else {
        const newField = await FieldTemplates.create({
          ...field,
          formTemplate: formId,
        });
        form.fieldTemplates.push(newField._id);
      }
    }

    // Save the updated form
    await form.save();

    // Return the updated form with populated fields
    const updatedForm = await FormTemplatesSchema.findById(formId).populate(
      "fieldTemplates"
    );
    res.status(200).json(updatedForm);
  } catch (err) {
    console.error("Update form error:", err);
    res.status(500).json({
      message: "Failed to update form",
      error: err.message,
    });
  }
};

exports.createFormTemplate = async (req, res) => {
  try {
    // Get the requesting user
    const requestingUser = await User.findById(req.user._id).populate(
      "institutions"
    );

    // Only admins and super admins can create templates
    if (
      !requestingUser.roles.includes("admin") &&
      !requestingUser.isSuperAdmin
    ) {
      return res.status(403).json({
        message: "Only admins can create form templates",
      });
    }

    // Determine institution
    let institutionId = req.body.institutionId;

    if (requestingUser.isSuperAdmin) {
      // Super admin: must provide institutionId
      if (!institutionId) {
        return res.status(400).json({
          message: "Super admin must specify institutionId",
        });
      }
    } else {
      // Institution admin: verify they are admin of the institution
      const Institution = require("../../models/Institutions");

      if (!institutionId) {
        // Find first institution where user is admin
        const adminInstitutions = await Institution.find({
          admins: requestingUser._id,
        });

        if (adminInstitutions.length === 0) {
          return res.status(403).json({
            message: "You are not an admin of any institution",
          });
        }

        institutionId = adminInstitutions[0]._id;
      } else {
        // Verify user is admin of specified institution
        const institution = await Institution.findOne({
          _id: institutionId,
          admins: requestingUser._id,
        });

        if (!institution) {
          return res.status(403).json({
            message: "You are not an admin of this institution",
          });
        }
      }
    }

    // Create form with scaleDescription and institution
    const newFormsTemplate = await FormTemplatesSchema.create({
      formName: req.body.formName,
      score: req.body.score,
      scaleDescription: req.body.scaleDescription,
      institution: institutionId,
    });
    const fieldTemplates = req.body.fieldTemplates;
    const createdFieldTemplate = [];

    // Create each field and store references
    for (const fieldTemplate of fieldTemplates) {
      const newFieldTemplate = await FieldTemplates.create({
        ...fieldTemplate,
        formTemplate: newFormsTemplate._id,
        institution: institutionId,
        options:
          fieldTemplate.type === "select" || fieldTemplate.type === "checkbox"
            ? fieldTemplate.options || []
            : [], // Save options for both select and checkbox
        scaleOptions:
          fieldTemplate.type === "scale"
            ? fieldTemplate.scaleOptions || []
            : [],
        selectedOptions: fieldTemplate.type === "checkbox" ? [] : undefined, // Initialize empty selected options for checkboxes
      });

      createdFieldTemplate.push(newFieldTemplate._id);
    }

    // Add field references to the form
    await FormTemplatesSchema.findByIdAndUpdate(newFormsTemplate._id, {
      $push: { fieldTemplates: { $each: createdFieldTemplate } },
    });

    const populatedForm = await FormTemplatesSchema.findById(
      newFormsTemplate._id
    )
      .populate("fieldTemplates")
      .populate("institution");

    res.status(201).json(populatedForm);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
