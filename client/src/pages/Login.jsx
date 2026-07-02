import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Lock, Mail, Loader2, Sparkles } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const { login, isAuthenticated, error, loading, setError } = useAuth();
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

    if (!email || !password) {
      setFormError('Please fill in all fields.');
      return;
    }

    const res = await login(email, password);
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
            Elevate your interview game with AI
          </h1>
          <p className="text-lg text-indigo-200 leading-relaxed">
            Get personalized ATS resume analysis, dynamic mock interviews, real-time feedback, and a dedicated career preparation copilot.
          </p>
        </div>

        <div className="text-sm text-indigo-300/80 relative z-10">
          &copy; {new Date().getFullYear()} InterviewAI Corp. All rights reserved.
        </div>
      </div>

      {/* Main Login Form Column */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-16 lg:px-20 relative">
        <div className="absolute top-8 right-8">
          <ThemeToggle />
        </div>

        <div className="mx-auto w-full max-w-md space-y-8">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">
              Sign In
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Welcome back! Please enter your details to access your account.
            </p>
          </div>

          {(formError || error) && (
            <div className="flex items-center gap-3 p-4 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20 animate-shake">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{formError || error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-sm font-semibold tracking-wide">
                  Password
                </label>
              </div>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out shadow-lg shadow-primary/20"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-semibold text-primary hover:text-primary/80 transition duration-150 ease-in-out"
            >
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
