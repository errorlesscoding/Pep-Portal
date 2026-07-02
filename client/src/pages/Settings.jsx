import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import { Settings as SettingsIcon, Loader2, Sparkles, Volume2, ShieldAlert, CheckCircle } from 'lucide-react';

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const [dbSettings, setDbSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchSettings = async () => {
    try {
      const res = await axios.get('/api/settings');
      if (res.data.success) {
        setDbSettings(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSettingField = async (field, value) => {
    setSaving(true);
    setMsg('');
    try {
      const res = await axios.put('/api/settings', {
        ...dbSettings,
        [field]: value,
      });
      if (res.data.success) {
        setDbSettings(res.data.data);
        setMsg('Settings updated successfully!');
        setTimeout(() => setMsg(''), 2000);
      }
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    toggleTheme(); // Update context & html tag class
    updateSettingField('theme', nextTheme);
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Loading visual settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl animate-fadeIn">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground mt-1">Configure preference modules and interview options.</p>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="h-4 w-4" /> {msg}
        </div>
      )}

      <div className="border rounded-2xl bg-card divide-y">
        
        {/* Theme */}
        <div className="p-6 flex items-center justify-between text-xs">
          <div className="space-y-1">
            <h3 className="font-bold text-sm">Theme Settings</h3>
            <p className="text-[10px] text-muted-foreground">Adjust display parameters between Dark and Light mode.</p>
          </div>
          <button 
            onClick={handleThemeChange}
            className="px-4 py-2 border rounded-xl font-bold bg-secondary hover:bg-muted text-foreground capitalize"
          >
            Switch to {theme === 'dark' ? 'light' : 'dark'}
          </button>
        </div>

        {/* Speech Dictation */}
        <div className="p-6 flex items-center justify-between text-xs">
          <div className="space-y-1">
            <h3 className="font-bold text-sm">Speech Inputs</h3>
            <p className="text-[10px] text-muted-foreground">Enable microphone permissions for interactive simulated rooms.</p>
          </div>
          <button 
            onClick={() => updateSettingField('speechEnabled', !dbSettings?.speechEnabled)}
            className={`px-4 py-2 border rounded-xl font-bold transition ${
              dbSettings?.speechEnabled
                ? 'bg-emerald-500 text-white border-emerald-500'
                : 'bg-secondary hover:bg-muted text-foreground'
            }`}
          >
            {dbSettings?.speechEnabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {/* Default Difficulty */}
        <div className="p-6 flex items-center justify-between text-xs">
          <div className="space-y-1">
            <h3 className="font-bold text-sm">Simulator Difficulty</h3>
            <p className="text-[10px] text-muted-foreground">Set default question complexity levels for new simulated interview rooms.</p>
          </div>
          
          <div className="flex gap-2">
            {['easy', 'medium', 'hard'].map((diff) => (
              <button
                key={diff}
                onClick={() => updateSettingField('difficultyPref', diff)}
                className={`px-3 py-1.5 border rounded-lg font-semibold capitalize ${
                  dbSettings?.difficultyPref === diff
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-secondary hover:bg-muted text-muted-foreground'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* AI Model details */}
        <div className="p-6 flex items-center justify-between text-xs">
          <div className="space-y-1">
            <h3 className="font-bold text-sm">AI Engine Configuration</h3>
            <p className="text-[10px] text-muted-foreground">Active generative model configuration for parser and simulator.</p>
          </div>
          <div className="font-bold text-primary flex items-center gap-1">
            <Sparkles className="h-4 w-4 animate-pulse" /> Gemini 1.5 Flash
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
