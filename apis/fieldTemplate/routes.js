const express = require('express');
const router = express.Router();
const { deleteFieldTemplate } = require('./controllers');

// Delete a field template
router.delete('/:id', deleteFieldTemplate);




module.exports = router;
