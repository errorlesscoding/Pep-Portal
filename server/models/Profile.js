const mongoose = require('mongoose');

const experienceItemSchema = new mongoose.Schema({
  company: { type: String, default: '' },
  role: { type: String, default: '' },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  description: { type: String, default: '' },
});

const projectItemSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  link: { type: String, default: '' },
});

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    phone: { type: String, default: '' },
    college: { type: String, default: '' },
    university: { type: String, default: '' },
    skills: [{ type: String }],
    experience: [experienceItemSchema],
    projects: [projectItemSchema],
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' },
    portfolio: { type: String, default: '' },
    profilePicture: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Profile', profileSchema);
