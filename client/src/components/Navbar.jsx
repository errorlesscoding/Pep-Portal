import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, LogOut, User as UserIcon } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="h-16 px-6 flex items-center justify-between border-b bg-card text-card-foreground transition-colors duration-200 sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <div className="bg-primary/10 p-2 rounded-lg">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          InterviewAI
        </span>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />

        {user && (
          <div className="flex items-center gap-3 pl-3 border-l">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-semibold">{user.name}</span>
              <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
            </div>
            
            <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20">
              {user.name.charAt(0).toUpperCase()}
            </div>

            <button
              onClick={logout}
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
