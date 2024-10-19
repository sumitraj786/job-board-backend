const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  experienceLevel: { type: String, required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  endDate: { type: Date, required: true },
  candidates: [{ type: String }],
});

module.exports = mongoose.model('Job', jobSchema);
