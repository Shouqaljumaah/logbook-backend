const FormSubmitions = require("../../models/FormSubmitions");
const FormTemplates = require("../../models/FormTemplates");
const FieldRecords = require("../../models/FieldRecords");
const FieldTemplates = require("../../models/FieldTemplates");

exports.getAllFormSubmitions = async (req, res) => {
  try {
    // const { userId } = req.params;
    const userId = req.user.id;
    // const { role } = req.query;
    const role = req.user.roles[0];
    console.log('Backend: Fetching submissions for:', { userId, role });

    let query;
    if (role?.toLowerCase() === 'tutor') {
      query = {
        tutor: userId
      };
    } else {
      query = {
        resident: userId
      };
    }

    console.log('Query:', query);

    const formSubmitions = await FormSubmitions.find(query)
      .populate({
        path: 'formTemplate',
        select: 'formName'
      })
      .populate({
        path: 'fieldRecord',
      })
      .populate({
        path: 'resident',
        select: 'username'
      })
      .populate({
        path: 'tutor',
        select: 'username'
      });

    console.log('Found submissions:', formSubmitions.length);
    
    return res.json(formSubmitions);
  } catch (error) {
    console.error('Error in getAllFormSubmitions:', error);
    res.status(500).json({ 
      message: 'Failed to fetch submissions',
      error: error.message 
    });
  }
};

exports.getFormSubmitions = async (req, res) => {
  const formSubmitions = await FormSubmitions.findById(req.params.id).populate({
    path: 'formTemplate',
    select: 'formName'
  })
  .populate({
    path: 'fieldRecord',
  })
  .populate({
    path: 'resident',
    select: 'username'
  })
  .populate({
    path: 'tutor',
    select: 'username'
  });
  res.json(formSubmitions);
};

exports.deleteFormSubmitions = async (req, res) => {
  try {
    await FormSubmitions.deleteOne({ _id: req.params.id });
    res.status(204).end();
  } catch (err) {
    return res.status(404).json({ message: "E" });
  }
};
///////////////////////////////////////////////

exports.reviewFormSubmitions = async (req, res) => {
  const { formSubmitionsId } = req.params;
  const fieldRecords = req.body.fieldRecords;
  const createdFieldRecord = [];

  for (const record of fieldRecords) {
    const newFieldRecord = await FieldRecords.create({
      ...record,
      formSubmitions: formSubmitionsId,
    });

    createdFieldRecord.push(newFieldRecord._id);
  }

  try {
    const foundFormSubmitions = await FormSubmitions.findByIdAndUpdate(
      formSubmitionsId,
      {
        $push: { fieldRecord: { $each: createdFieldRecord } },
      }
    );
    const updatedFormSubmition = await FormSubmitions.findById(
      formSubmitionsId
    ).populate("fieldRecord");
    if (foundFormSubmitions) {
      res.status(200).json(updatedFormSubmition);
    } else {
      res.status(404).json({ message: " Not Found" });
    }
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
      console.log("record is this ",record)
      const fieldTemplate = await FieldTemplates.findById(record.fieldTemplate)
      console.log("fieldTemplate is this ",fieldTemplate._id)
      const newFieldRecord = await FieldRecords.create({
        ...record,
        fieldTemplate: record.fieldTemplate
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
