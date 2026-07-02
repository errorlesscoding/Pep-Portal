import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  User, Mail, Phone, BookOpen, Compass, Globe, 
  Linkedin, Github, Edit3, Save, Plus, Trash2, Loader2, CheckCircle 
} from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [msg, setMsg] = useState('');

  // Editable Form states
  const [phone, setPhone] = useState('');
  const [college, setCollege] = useState('');
  const [university, setUniversity] = useState('');
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState([]);
  const [projects, setProjects] = useState([]);
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [portfolio, setPortfolio] = useState('');

  const fetchProfile = async () => {
    try {
      const res = await axios.get('/api/profile');
      if (res.data.success) {
        const data = res.data.data;
        setProfile(data);
        // Bind form values
        setPhone(data.phone || '');
        setCollege(data.college || '');
        setUniversity(data.university || '');
        setSkills(data.skills?.join(', ') || '');
        setExperience(data.experience || []);
        setProjects(data.projects || []);
        setLinkedin(data.linkedin || '');
        setGithub(data.github || '');
        setPortfolio(data.portfolio || '');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleAddExperience = () => {
    setExperience([...experience, { company: '', role: '', startDate: '', endDate: '', description: '' }]);
  };

  const handleRemoveExperience = (idx) => {
    setExperience(experience.filter((_, i) => i !== idx));
  };

  const handleExperienceChange = (idx, field, value) => {
    const updated = experience.map((item, i) => {
      if (i === idx) return { ...item, [field]: value };
      return item;
    });
    setExperience(updated);
  };

  const handleAddProject = () => {
    setProjects([...projects, { title: '', description: '', link: '' }]);
  };

  const handleRemoveProject = (idx) => {
    setProjects(projects.filter((_, i) => i !== idx));
  };

  const handleProjectChange = (idx, field, value) => {
    const updated = projects.map((item, i) => {
      if (i === idx) return { ...item, [field]: value };
      return item;
    });
    setProjects(updated);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    try {
      const res = await axios.put('/api/profile', {
        phone,
        college,
        university,
        skills,
        experience,
        projects,
        linkedin,
        github,
        portfolio,
      });

      if (res.data.success) {
        setProfile(res.data.data);
        setEditMode(false);
        setMsg('Profile updated successfully!');
        setTimeout(() => setMsg(''), 3000);
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert('Error updating profile settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Loading profile credentials...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Professional Profile</h1>
          <p className="text-muted-foreground mt-1">Configure your credentials, experiences, and social handles.</p>
        </div>
        {!editMode && (
          <button
            onClick={() => setEditMode(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:bg-primary/95 transition shadow-sm"
          >
            <Edit3 className="h-4 w-4" /> Edit Profile
          </button>
        )}
      </div>

      {msg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="h-4 w-4" /> {msg}
        </div>
      )}

      {/* Main card */}
      {!editMode ? (
        // View Mode details
        <div className="space-y-6">
          <div className="border rounded-2xl bg-card overflow-hidden shadow-sm">
            <div className="h-32 bg-gradient-to-r from-primary to-purple-600"></div>
            <div className="px-6 pb-6 relative">
              <div className="absolute -top-12 left-6">
                <div className="h-24 w-24 rounded-full border-4 border-card bg-primary/15 text-primary flex items-center justify-center font-extrabold text-3xl">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              </div>
              
              <div className="pt-16 space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{user?.name}</h2>
                  <p className="text-xs text-muted-foreground capitalize">{profile?.university || 'Candidate'} Student</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-4 border-t">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Email Address</p>
                      <p className="font-semibold">{user?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Phone Number</p>
                      <p className="font-semibold">{profile?.phone || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">College / Institution</p>
                      <p className="font-semibold">{profile?.college || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Compass className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">University</p>
                      <p className="font-semibold">{profile?.university || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Social list */}
                <div className="flex gap-3 pt-2">
                  {profile?.linkedin && (
                    <a href={profile.linkedin} target="_blank" rel="noreferrer" className="p-2 bg-secondary text-primary rounded-lg hover:bg-muted border transition">
                      <Linkedin className="h-4 w-4" />
                    </a>
                  )}
                  {profile?.github && (
                    <a href={profile.github} target="_blank" rel="noreferrer" className="p-2 bg-secondary text-foreground rounded-lg hover:bg-muted border transition">
                      <Github className="h-4 w-4" />
                    </a>
                  )}
                  {profile?.portfolio && (
                    <a href={profile.portfolio} target="_blank" rel="noreferrer" className="p-2 bg-secondary text-indigo-500 rounded-lg hover:bg-muted border transition">
                      <Globe className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="p-6 border rounded-2xl bg-card space-y-4">
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-widest">Technical Skills</h3>
            {profile?.skills?.length === 0 ? (
              <p className="text-xs text-muted-foreground">No skills added yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile?.skills?.map((skill, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-secondary text-foreground text-xs font-semibold rounded-lg border capitalize">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Work experience */}
          <div className="p-6 border rounded-2xl bg-card space-y-4">
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-widest">Work History</h3>
            {profile?.experience?.length === 0 ? (
              <p className="text-xs text-muted-foreground">No experience logged yet.</p>
            ) : (
              <div className="space-y-4">
                {profile?.experience?.map((exp, idx) => (
                  <div key={idx} className="border-l-2 border-primary pl-4 py-1 space-y-1 text-xs">
                    <h4 className="font-bold text-sm">{exp.role} at {exp.company}</h4>
                    <p className="text-muted-foreground font-semibold">{exp.startDate} - {exp.endDate}</p>
                    <p className="text-foreground/80 leading-relaxed mt-1">{exp.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Projects */}
          <div className="p-6 border rounded-2xl bg-card space-y-4">
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-widest">Featured Projects</h3>
            {profile?.projects?.length === 0 ? (
              <p className="text-xs text-muted-foreground">No projects listed yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile?.projects?.map((proj, idx) => (
                  <div key={idx} className="p-4 border rounded-xl bg-secondary/10 space-y-2 text-xs">
                    <h4 className="font-bold text-sm">{proj.title}</h4>
                    <p className="text-muted-foreground leading-relaxed">{proj.description}</p>
                    {proj.link && (
                      <a href={proj.link} target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold inline-flex items-center gap-1">
                        View Project <Globe className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        // Edit Mode forms
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Core Info */}
          <div className="p-6 border rounded-2xl bg-card space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Personal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  className="w-full p-2.5 bg-background border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold">College / Institution</label>
                <input
                  type="text"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  placeholder="MIT, School of Engineering"
                  className="w-full p-2.5 bg-background border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold">University</label>
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="Harvard University"
                  className="w-full p-2.5 bg-background border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold">Skills (Comma-separated)</label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="React, Node.js, Python, AWS"
                  className="w-full p-2.5 bg-background border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                />
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="p-6 border rounded-2xl bg-card space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Social Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold">LinkedIn Profile URL</label>
                <input
                  type="text"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full p-2.5 bg-background border rounded-xl focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold">GitHub Profile URL</label>
                <input
                  type="text"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="https://github.com/username"
                  className="w-full p-2.5 bg-background border rounded-xl focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold">Portfolio URL</label>
                <input
                  type="text"
                  value={portfolio}
                  onChange={(e) => setPortfolio(e.target.value)}
                  placeholder="https://portfolio.com"
                  className="w-full p-2.5 bg-background border rounded-xl focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Experience Lists */}
          <div className="p-6 border rounded-2xl bg-card space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Work Experience</h3>
              <button
                type="button"
                onClick={handleAddExperience}
                className="flex items-center gap-1 px-3 py-1 bg-secondary text-foreground hover:bg-muted text-xs rounded-lg border font-semibold"
              >
                <Plus className="h-3.5 w-3.5" /> Add Experience
              </button>
            </div>

            <div className="space-y-4">
              {experience.map((exp, idx) => (
                <div key={idx} className="p-4 border rounded-xl bg-secondary/5 space-y-3 relative text-xs">
                  <button
                    type="button"
                    onClick={() => handleRemoveExperience(idx)}
                    className="absolute top-4 right-4 text-destructive hover:bg-destructive/10 p-1.5 rounded-lg border border-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-semibold">Company</label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => handleExperienceChange(idx, 'company', e.target.value)}
                        className="w-full p-2 bg-background border rounded-lg"
                        placeholder="Company Name"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold">Role</label>
                      <input
                        type="text"
                        value={exp.role}
                        onChange={(e) => handleExperienceChange(idx, 'role', e.target.value)}
                        className="w-full p-2 bg-background border rounded-lg"
                        placeholder="Job Title"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold">Start Date</label>
                      <input
                        type="text"
                        value={exp.startDate}
                        onChange={(e) => handleExperienceChange(idx, 'startDate', e.target.value)}
                        className="w-full p-2 bg-background border rounded-lg"
                        placeholder="Jan 2021"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold">End Date</label>
                      <input
                        type="text"
                        value={exp.endDate}
                        onChange={(e) => handleExperienceChange(idx, 'endDate', e.target.value)}
                        className="w-full p-2 bg-background border rounded-lg"
                        placeholder="Dec 2023 / Present"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold">Description</label>
                    <textarea
                      rows={3}
                      value={exp.description}
                      onChange={(e) => handleExperienceChange(idx, 'description', e.target.value)}
                      className="w-full p-2 bg-background border rounded-lg"
                      placeholder="Detail your responsibilities and achievements..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Featured Projects Lists */}
          <div className="p-6 border rounded-2xl bg-card space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Featured Projects</h3>
              <button
                type="button"
                onClick={handleAddProject}
                className="flex items-center gap-1 px-3 py-1 bg-secondary text-foreground hover:bg-muted text-xs rounded-lg border font-semibold"
              >
                <Plus className="h-3.5 w-3.5" /> Add Project
              </button>
            </div>

            <div className="space-y-4">
              {projects.map((proj, idx) => (
                <div key={idx} className="p-4 border rounded-xl bg-secondary/5 space-y-3 relative text-xs">
                  <button
                    type="button"
                    onClick={() => handleRemoveProject(idx)}
                    className="absolute top-4 right-4 text-destructive hover:bg-destructive/10 p-1.5 rounded-lg border border-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-semibold">Project Title</label>
                      <input
                        type="text"
                        value={proj.title}
                        onChange={(e) => handleProjectChange(idx, 'title', e.target.value)}
                        className="w-full p-2 bg-background border rounded-lg"
                        placeholder="Project Name"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold">Project Link</label>
                      <input
                        type="text"
                        value={proj.link}
                        onChange={(e) => handleProjectChange(idx, 'link', e.target.value)}
                        className="w-full p-2 bg-background border rounded-lg"
                        placeholder="https://github.com/..."
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold">Description</label>
                    <textarea
                      rows={3}
                      value={proj.description}
                      onChange={(e) => handleProjectChange(idx, 'description', e.target.value)}
                      className="w-full p-2 bg-background border rounded-lg"
                      placeholder="Detail project specifications and design frameworks..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:bg-primary/95 transition shadow-sm disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Profile
            </button>
            <button
              type="button"
              onClick={() => {
                setEditMode(false);
                fetchProfile();
              }}
              className="px-6 py-2.5 border rounded-xl text-xs font-semibold hover:bg-secondary transition"
            >
              Cancel
            </button>
          </div>

        </form>
      )}

    </div>
  );
};

export default Profile;
