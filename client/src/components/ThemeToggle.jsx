import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-muted transition-colors duration-200"
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-yellow-400 animate-pulse" />
      ) : (
        <Moon className="h-5 w-5 text-indigo-600 hover:rotate-12 transition-transform" />
      )}
    </button>
  );
};

export default ThemeToggle;
