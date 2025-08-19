const mongoose = require('mongoose');

const approvedNameSchema = new mongoose.Schema({
    yearList: String,
    serviceLine: String,
    ipr: String,
    approvedName: String,
    approvalDate: String,
    description: String,
    contactPerson: String,
    trademark: String,
    notes: String,
    previouslyKnownAs: String,
    category: String,
    class: String,
    iprAssetStatus: String,
});

module.exports = mongoose.model('ApprovedName', approvedNameSchema);