const Profile = require('../models/Profile');

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user._id });
    
    if (!profile) {
      profile = await Profile.create({
        user: req.user._id,
        skills: [],
        experience: [],
        projects: [],
      });
    }

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving profile' });
  }
};

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const { phone, college, university, skills, experience, projects, linkedin, github, portfolio } = req.body;

    let profile = await Profile.findOne({ user: req.user._id });
    
    if (!profile) {
      profile = new Profile({ user: req.user._id });
    }

    // Assign properties (with fallback checks)
    profile.phone = phone !== undefined ? phone : profile.phone;
    profile.college = college !== undefined ? college : profile.college;
    profile.university = university !== undefined ? university : profile.university;
    profile.linkedin = linkedin !== undefined ? linkedin : profile.linkedin;
    profile.github = github !== undefined ? github : profile.github;
    profile.portfolio = portfolio !== undefined ? portfolio : profile.portfolio;
    
    if (skills !== undefined) {
      profile.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim()).filter(Boolean);
    }
    
    if (experience !== undefined) {
      profile.experience = Array.isArray(experience) ? experience : [];
    }

    if (projects !== undefined) {
      profile.projects = Array.isArray(projects) ? projects : [];
    }

    await profile.save();

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: 'Server error updating profile' });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
};
