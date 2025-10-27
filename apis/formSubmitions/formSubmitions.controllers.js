const FormSubmitions = require("../../models/FormSubmitions");
const FormTemplates = require("../../models/FormTemplates");
const FieldRecords = require("../../models/FieldRecords");
const FieldTemplates = require("../../models/FieldTemplates");
const Users = require("../../models/Users");

exports.getAllFormSubmitions = async (req, res) => {
  try {
    // Get the requesting user to determine institution access
    const requestingUser = await Users.findById(req.user.id).populate(
      "institutions"
    );

    const userId = req.user.id;
    const role = req.user.roles[0];
    const { formPlatform, institutionId } = req.query;

    let query = {};

    // Filter by institution
    if (requestingUser.isSuperAdmin) {
      // Super admin: can request specific institution or all
      if (institutionId) {
        query.institution = institutionId;
      }
      // If no institutionId, return all submissions (no filter)
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
        // No specific institution requested - return submissions from all their institutions
        query.institution = { $in: userInstitutionIds };
      }
    }

    // Filter by role
    if (formPlatform !== "web") {
      if (role?.toLowerCase() === "tutor") {
        query.tutor = userId;
      } else {
        query.resident = userId;
      }
    }

    const formSubmitions = await FormSubmitions.find(query)
      .sort({ createdAt: -1 })
      .populate({
        path: "formTemplate",
        select: "formName",
        populate: {
          path: "fieldTemplates",
          select: "fieldType",
        },
      })
      .populate({
        path: "fieldRecord",
      })
      .populate({
        path: "resident",
        select: "username",
      })
      .populate({
        path: "tutor",
        select: "username",
      })
      .populate("institution");

    console.log("Found submissions:", formSubmitions[0]);

    return res.json(formSubmitions);
  } catch (error) {
    console.error("Error in getAllFormSubmitions:", error);
    res.status(500).json({
      message: "Failed to fetch submissions",
      error: error.message,
    });
  }
};

exports.getFormSubmitions = async (req, res) => {
  try {
    const formSubmitions = await FormSubmitions.findById(req.params.id)
      .populate({
        path: "formTemplate",
        select: "formName",
      })
      .populate({
        path: "fieldRecord",
      })
      .populate({
        path: "resident",
        select: "username",
      })
      .populate({
        path: "tutor",
        select: "username",
      })
      .populate("institution");

    if (!formSubmitions) {
      return res.status(404).json({ message: "Form submission not found" });
    }

    // Check if user has access to this submission's institution
    const requestingUser = await Users.findById(req.user.id).populate(
      "institutions"
    );
    if (!requestingUser.isSuperAdmin) {
      const hasAccess = requestingUser.institutions.some(
        (inst) =>
          inst._id.toString() === formSubmitions.institution._id.toString()
      );
      if (!hasAccess) {
        return res
          .status(403)
          .json({ message: "Access denied to this institution's submissions" });
      }
    }

    res.json(formSubmitions);
  } catch (error) {
    console.error("Error getting form submission:", error);
    return res.status(500).json({ message: error.message });
  }
};

// exports.deleteFormSubmitions = async (req, res) => {
//   try {
//     await FormSubmitions.deleteOne({ _id: req.params.id });
//     res.status(204).end();
//   } catch (err) {
//     return res.status(404).json({ message: "E" });
//   }
// };
///////////////////////////////////////////////

exports.reviewFormSubmitions = async (req, res) => {
  const { formSubmitionsId } = req.params;
  const fieldRecords = req.body.fieldRecords;
  const createdFieldRecord = [];

  try {
    // Create field records
    for (const record of fieldRecords) {
      const newFieldRecord = await FieldRecords.create({
        ...record,
        formSubmitions: formSubmitionsId,
      });
      createdFieldRecord.push(newFieldRecord._id);
    }

    // Update form submission with new field records
    const foundFormSubmitions = await FormSubmitions.findByIdAndUpdate(
      formSubmitionsId,
      {
        $push: { fieldRecord: { $each: createdFieldRecord } },
      },
      { new: true } // Return updated document
    );

    if (!foundFormSubmitions) {
      return res.status(404).json({ message: "Form submission not found" });
    }

    // Get form template and check completion
    const formTemplate = await FormTemplates.findById(
      foundFormSubmitions.formTemplate
    );
    if (!formTemplate) {
      return res.status(404).json({ message: "Form template not found" });
    }

    const fieldTemplatesCount = formTemplate.fieldTemplates.length;
    const fieldRecordsCount = foundFormSubmitions.fieldRecord.length;

    // Update status if all fields are completed
    if (fieldRecordsCount === fieldTemplatesCount) {
      const updatedFormSubmition = await FormSubmitions.findByIdAndUpdate(
        formSubmitionsId,
        { $set: { status: "completed" } },
        { new: true }
      ).populate("fieldRecord");

      return res.status(200).json(updatedFormSubmition);
    }

    // If not all fields are completed, return the current state
    return res.status(200).json(foundFormSubmitions);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// create recods with the filedId and newFormSubmitionsId
// each field has many reord
// each recod belong to a form submition

exports.createFormSubmition = async (req, res) => {
  try {
    const fieldRecords = req.body.fieldRecords;
    const createdFieldRecord = [];

    // Get the requesting user
    const requestingUser = await Users.findById(req.user.id).populate(
      "institutions"
    );

    // Validate that formtemplate exists first
    const formTemplateDoc = await FormTemplates.findById(
      req.body.formtemplate
    ).populate("institution");
    if (!formTemplateDoc) {
      return res.status(404).json({
        message: `FormTemplate with ID ${req.body.formtemplate} not found`,
      });
    }

    // The institution is ALWAYS determined by the form template
    const institutionId =
      formTemplateDoc.institution._id || formTemplateDoc.institution;

    // Verify user belongs to this institution (for any role)
    if (!requestingUser.isSuperAdmin) {
      const userBelongsToInstitution = requestingUser.institutions.some(
        (inst) => inst._id.toString() === institutionId.toString()
      );

      if (!userBelongsToInstitution) {
        return res.status(403).json({
          message: "You don't belong to the institution of this form template",
        });
      }
    }

    // Verify resident and tutor belong to the institution
    const resident = await Users.findById(req.body.resident);
    const tutor = await Users.findById(req.body.tutor);

    if (!resident || !tutor) {
      return res.status(404).json({
        message: "Resident or tutor not found",
      });
    }

    // Check if resident belongs to institution
    const residentBelongsToInstitution = resident.institutions.some(
      (inst) => inst.toString() === institutionId.toString()
    );
    if (!residentBelongsToInstitution) {
      return res.status(400).json({
        message: "Resident does not belong to this institution",
      });
    }

    // Check if tutor belongs to institution
    const tutorBelongsToInstitution = tutor.institutions.some(
      (inst) => inst.toString() === institutionId.toString()
    );
    if (!tutorBelongsToInstitution) {
      return res.status(400).json({
        message: "Tutor does not belong to this institution",
      });
    }

    // First create the form submission
    const newFormSubmitions = await FormSubmitions.create({
      formTemplate: formTemplateDoc._id,
      resident: req.body.resident,
      tutor: req.body.tutor,
      submissionDate: new Date(req.body.submissionDate),
      fieldRecord: [],
      institution: institutionId,
    });

    // Create each field and store references
    for (const record of fieldRecords) {
      console.log("record is this ", record);
      const fieldTemplate = await FieldTemplates.findById(record.fieldTemplate);
      console.log("fieldTemplate is this ", fieldTemplate._id);
      const newFieldRecord = await FieldRecords.create({
        ...record,
        fieldTemplate: record.fieldTemplate,
      });

      createdFieldRecord.push(newFieldRecord._id);
    }

    // Update the form submission with the record IDs
    await FormSubmitions.findByIdAndUpdate(newFormSubmitions._id, {
      $push: { fieldRecord: { $each: createdFieldRecord } },
    });

    // Fetch the updated form submission with populated records
    const updatedFormSubmition = await FormSubmitions.findById(
      newFormSubmitions._id
    )
      .populate("fieldRecord")
      .populate("formTemplate")
      .populate("resident")
      .populate("tutor")
      .populate("institution");

    res.status(201).json(updatedFormSubmition);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.deletFormSubmition = async (req, res) => {
  try {
    const formSubmition = await FormSubmitions.findById(
      req.params.formSubmitionsId
    ); // find the form submition by id
    if (!formSubmition) {
      return res.status(404).json({ message: "Form submission not found" }); // send an error response
    }

    if (formSubmition.tutor.toString() !== req.user.id) {
      // check if the tutor is the same as the user
      return res.status(403).json({ message: "Unauthorized" }); // send an error response
    }
    await FormSubmitions.deleteOne({ _id: req.params.formSubmitionsId }); // delete the form submition
    await FieldRecords.deleteMany({
      formSubmitions: req.params.formSubmitionsId,
    }); // delete the field records

    res.status(204).end(); // send a success response
  } catch (err) {
    return res.status(404).json({ message: err.message }); // send an error response
  }
};

// get for submitions by user id
exports.getFormSubmitionsByUserId = async (req, res) => {
  try {
    const userId = req.params.id;

    // Get the requesting user to determine institution access
    const requestingUser = await Users.findById(req.user.id).populate(
      "institutions"
    );

    // Get user
    const user = await Users.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Build query
    let query = {};
    if (user.roles.includes("tutor")) {
      query.tutor = userId;
    } else {
      query.resident = userId;
    }

    // Filter by institution
    if (!requestingUser.isSuperAdmin) {
      const institutionIds = requestingUser.institutions.map(
        (inst) => inst._id
      );
      query.institution = { $in: institutionIds };
    }

    const formSubmitions = await FormSubmitions.find(query)
      .sort({ createdAt: -1 })
      .populate({
        path: "formTemplate",
        select: "formName",
        populate: {
          path: "fieldTemplates",
          select: "fieldType",
        },
      })
      .populate({
        path: "fieldRecord",
      })
      .populate({
        path: "resident",
        select: "username",
      })
      .populate({
        path: "tutor",
        select: "username",
      })
      .populate("institution");

    return res.json(formSubmitions);
  } catch (error) {
    console.error("Error getting form submissions by user id:", error);
    return res.status(500).json({ message: error.message });
  }
};
