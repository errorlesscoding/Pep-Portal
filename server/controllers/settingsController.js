const Settings = require('../models/Settings');

// @desc    Get user settings
// @route   GET /api/settings
// @access  Private
const getUserSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ user: req.user._id });
    
    if (!settings) {
      settings = await Settings.create({
        user: req.user._id,
        theme: 'light',
        speechEnabled: false,
        difficultyPref: 'medium',
      });
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving settings' });
  }
};

// @desc    Update user settings
// @route   PUT /api/settings
// @access  Private
const updateUserSettings = async (req, res) => {
  try {
    const { theme, speechEnabled, difficultyPref } = req.body;

    let settings = await Settings.findOne({ user: req.user._id });
    
    if (!settings) {
      settings = new Settings({ user: req.user._id });
    }

    if (theme !== undefined) settings.theme = theme;
    if (speechEnabled !== undefined) settings.speechEnabled = speechEnabled;
    if (difficultyPref !== undefined) settings.difficultyPref = difficultyPref;

    await settings.save();

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ success: false, message: 'Server error updating settings' });
  }
};

module.exports = {
  getUserSettings,
  updateUserSettings,
};
