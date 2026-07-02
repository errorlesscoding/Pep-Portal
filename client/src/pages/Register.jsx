import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Lock, Mail, User, Loader2, Sparkles } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  const { register, isAuthenticated, error, loading, setError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Clear any previous global auth errors when mounting
    setError(null);
  }, [setError]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name || !email || !password || !confirmPassword) {
      setFormError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    const res = await register(name, email, password);
    if (res && res.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background transition-colors duration-200">
      
      {/* Decorative Brand/Info Column (Visible on large screens) */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-900 text-white relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse delay-75"></div>

        <div className="flex items-center gap-2 relative z-10">
          <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md border border-white/20">
            <Sparkles className="h-6 w-6 text-purple-300" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-purple-200 to-white bg-clip-text text-transparent">
            InterviewAI
          </span>
        </div>

        <div className="space-y-6 relative z-10 max-w-md">
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
            Accelerate your career preparation today
          </h1>
          <p className="text-lg text-indigo-200 leading-relaxed">
            Create an account to gain instant access to our comprehensive resume optimization suites and simulated, dynamic AI interview environments.
          </p>
        </div>

        <div className="text-sm text-indigo-300/80 relative z-10">
          &copy; {new Date().getFullYear()} InterviewAI Corp. All rights reserved.
        </div>
      </div>

      {/* Main Register Form Column */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-16 lg:px-20 relative">
        <div className="absolute top-8 right-8">
          <ThemeToggle />
        </div>

        <div className="mx-auto w-full max-w-md space-y-8">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">
              Create an Account
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign up today and kickstart your interview journey.
            </p>
          </div>

          {(formError || error) && (
            <div className="flex items-center gap-3 p-4 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20 animate-shake">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{formError || error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-semibold tracking-wide">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <User className="h-5 w-5" />
                </div>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-150 ease-in-out text-sm"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-150 ease-in-out text-sm"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-semibold tracking-wide">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-150 ease-in-out text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-semibold tracking-wide">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-150 ease-in-out text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out shadow-lg shadow-primary/20 mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-primary hover:text-primary/80 transition duration-150 ease-in-out"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
