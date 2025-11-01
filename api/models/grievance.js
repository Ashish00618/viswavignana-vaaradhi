// api/models/grievance.js
const mongoose = require('mongoose');

const grievanceSchema = new mongoose.Schema({
    fullName: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, match: [/^\d{10}$/, 'Must be a 10-digit mobile number'] },
    email: { type: String, trim: true, lowercase: true },
    state: { type: String, required: true },
    district: { type: String, required: true },
    mandal: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    subcategory: { type: String, required: true },
    description: { type: String, required: true, trim: true },
    declaration: { type: Boolean, required: true, enum: [true] }, // Ensures checkbox is checked
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Grievance || mongoose.model('Grievance', grievanceSchema);