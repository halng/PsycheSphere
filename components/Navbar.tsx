
import React from 'react';
import { UserRole } from '../types';

interface NavbarProps {
  role: UserRole;
  setRole: (role: UserRole) => void;
  isDark: boolean;
  toggleTheme: () => void;
  onHomeClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ role, setRole, isDark, toggleTheme, onHomeClick }) => {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center cursor-pointer" onClick={onHomeClick}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white shadow-lg">
              <span className="text-lg font-bold">Ψ</span>
            </div>
            <span className="ml-3 text-xl font-bold tracking-tight text-slate-900 dark:text-white">PsycheSphere</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setRole(role === 'reader' ? 'writer' : 'reader')}
              className="rounded-full bg-slate-100 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
            >
              Switch to {role === 'reader' ? 'Writer' : 'Reader'}
            </button>

            <button
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
