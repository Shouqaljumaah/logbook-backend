const FieldTemplate = require('../../models/FieldTemplates');
const FormTemplatesSchema = require('../../models/FormTemplates');

// Delete a field template
exports.deleteFieldTemplate = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the field template first
        const fieldTemplate = await FieldTemplate.findById(id);
        if (!fieldTemplate) {
            return res.status(404).json({ message: 'Field template not found' });
        }

        // Get the form ID before deleting the field
        const formId = fieldTemplate.formTemplate;

        // Delete the field template
        await FieldTemplate.findByIdAndDelete(id);

        // Remove the field reference from the form
        await FormTemplatesSchema.findByIdAndUpdate(
            formId,
            { $pull: { fieldTemplates: id } }
        );

        res.status(200).json({ 
            message: 'Field template deleted successfully',
            deletedFieldId: id
        });
    } catch (error) {
        console.error('Delete field error:', error);
        res.status(500).json({ 
            message: 'Error deleting field template', 
            error: error.message 
        });
    }
};