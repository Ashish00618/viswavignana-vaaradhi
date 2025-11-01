// api/models/volunteer.js
const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema({
    fullName: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: [18, 'Must be 18 or older to volunteer'] },
    occupation: { type: String, required: true, trim: true },
    state: { type: String, required: true },
    district: { type: String, required: true },
    assemblyConstituency: { type: String, required: true },
    mandal: { type: String, required: true, trim: true },
    village: { type: String, required: true, trim: true },
    pinCode: { type: String, required: true, match: [/^\d{6}$/, 'Must be a 6-digit PIN code'] },
    mobileNumber: { type: String, required: true, match: [/^\d{10}$/, 'Must be a 10-digit mobile number'] },
    email: { type: String, trim: true, lowercase: true },
    areaOfInterest: { type: String, required: true },
    availability: { type: String, required: true },
    skills: { type: String, trim: true },
    preferredWing: { type: [String], required: true },
    financialContribution: { type: String, required: true, enum: ['yes', 'no'] },
    declaration: { type: Boolean, required: true, enum: [true] },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Volunteer || mongoose.model('Volunteer', volunteerSchema);