const FormSubmitions = require("../../models/FormSubmitions");
const FormTemplates = require("../../models/FormTemplates");
const FieldRecords = require("../../models/FieldRecords");
const FieldTemplates = require("../../models/FieldTemplates");
const Users = require("../../models/Users");

exports.getAllFormSubmitions = async (req, res) => {
  try {
    // const { userId } = req.params;
    const userId = req.user.id;
    // const { role } = req.query;
    const role = req.user.roles[0];
    // console.log("Backend: Fetching submissions for:", { userId, role });s
    const { formPlatform } = req.query;
    let query;
    console.log("formPlatform", formPlatform);
    if (formPlatform === "web") {
    } else {
      if (role?.toLowerCase() === "tutor") {
        query = {
          tutor: userId,
        };
      } else {
        query = {
          resident: userId,
        };
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
      });

    // Check if each form submission is completed
    // for (const submission of formSubmitions) {
    //   const fieldTemplates = submission.formTemplate.fieldTemplates.length  ;
    //   const fieldRecords = submission.fieldRecord.length;
    //   if(fieldTemplates === fieldRecords){
    //   submission.status = "completed";
    //   }else{
    //     submission.status = "pending";
    //   }
    //   // if (submission.fieldRecord && submission.fieldRecord.length > 0) {
    //   //   // If there are field records, mark as completed
    //   //   submission.status = "completed";
    //   // } else {
    //   //   // If no field records, mark as pending
    //   //   submission.status = "pending";
    //   // }
    //   // await submission.save();
    // }

    console.log("Found submissions:", formSubmitions.length);

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
    });
  res.json(formSubmitions);
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
    // this message shown if i not exists formtemplate first  "message": "Cannot access 'formTemplate' before initialization", so i said find this template by id if not found show error
    // 1. Validate that formtemplate exists first
    const formTemplateDoc = await FormTemplates.findById(req.body.formtemplate);
    if (!formTemplateDoc) {
      return res.status(404).json({
        message: `FormTemplate with ID ${req.body.formtemplate} not found`,
      });
    }

    // First create the form submission
    const newFormSubmitions = await FormSubmitions.create({
      formTemplate: formTemplateDoc._id, // i change it because he can't find id of formtemplate, so i said Use the found template
      resident: req.body.resident,
      tutor: req.body.tutor,
      submissionDate: new Date(req.body.submissionDate),
      fieldRecord: [],
    });

    // Create records for each field

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
      .populate("tutor");

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
  const userId = req.params.id;
  //get user
  const user = await Users.findById(userId);
  let formSubmitions;
  if (user.roles.includes("tutor")) {
    formSubmitions = await FormSubmitions.find({ tutor: userId })
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
      });
  } else {
    formSubmitions = await FormSubmitions.find({ resident: userId })
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
      });
  }
  return res.json(formSubmitions);
};
