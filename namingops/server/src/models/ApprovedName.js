const mongoose = require('mongoose');

const approvedNameSchema = new mongoose.Schema({
    'Year list': String,
    'Service Line': String,
    'IPR': String,
    'Approved name': String,
    'Approval date': String,
    'Description': String,
    'Contact person': String,
    'Trademark': String,
    'Notes': String,
    'Previously Known As / AKA': String,
    'Class': String,
    'IPR Asset Status': String,
});

module.exports = mongoose.model('ApprovedName', approvedNameSchema);