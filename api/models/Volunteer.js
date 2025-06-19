// api/models/volunteer.js
const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  age: { type: Number, required: true },
  occupation: { type: String, required: true },
  state: { type: String, required: true },
  district: { type: String, required: true },
  assemblyConstituency: { type: String, required: true },
  mandal: { type: String, required: true },
  village: { type: String, required: true },
  pinCode: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  email: { type: String },
  areaOfInterest: { type: String, required: true },
  availability: { type: String, required: true },
  skills: { type: String },
  preferredWing: { type: [String], required: true },
  financialContribution: { type: String, required: true },
  declaration: { type: Boolean, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Volunteer', volunteerSchema);