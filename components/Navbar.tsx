
import React, { useState } from 'react';
import { UserRole, UserProfile, Notification } from '../types';

interface NavbarProps {
  role: UserRole;
  setRole: (role: UserRole) => void;
  isDark: boolean;
  toggleTheme: () => void;
  onHomeClick: () => void;
  onProfileClick: () => void;
  currentView: 'feed' | 'profile';
  profile: UserProfile;
  notifications: Notification[];
  onMarkRead: (id: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  role, 
  setRole, 
  isDark, 
  toggleTheme, 
  onHomeClick, 
  onProfileClick,
  currentView,
  profile,
  notifications,
  onMarkRead
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center cursor-pointer" onClick={onHomeClick}>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white shadow-lg">
                <span className="text-lg font-bold">Ψ</span>
              </div>
              <span className="ml-3 text-xl font-bold tracking-tight text-slate-900 dark:text-white">PsycheSphere</span>
            </div>

            <div className="hidden md:flex items-center gap-1">
              <button 
                onClick={onHomeClick}
                className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${currentView === 'feed' ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Feed
              </button>
              <button 
                onClick={onProfileClick}
                className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${currentView === 'profile' ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Profile
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setRole(role === 'reader' ? 'writer' : 'reader')}
              className="rounded-full bg-slate-100 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
            >
              Switch to {role === 'reader' ? 'Writer' : 'Reader'}
            </button>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>

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

            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-950">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 z-50 animate-in zoom-in-95 fade-in duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{unreadCount} Unread</span>
                  </div>
                  <div className="max-h-96 overflow-y-auto space-y-3 custom-scrollbar">
                    {notifications.length > 0 ? (
                      notifications.map(notification => (
                        <div 
                          key={notification.id} 
                          onClick={() => onMarkRead(notification.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer ${notification.read ? 'bg-slate-50 border-slate-100 dark:bg-slate-900/30 dark:border-slate-800/50' : 'bg-primary-50 border-primary-100 dark:bg-primary-900/10 dark:border-primary-900/30'}`}
                        >
                          <p className="text-xs font-bold text-slate-900 dark:text-white mb-1">{notification.title}</p>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{notification.message}</p>
                          <p className="text-[9px] text-slate-400 mt-2">{notification.date}</p>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center">
                        <p className="text-xs text-slate-400">No notifications yet</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={onProfileClick}
              className="flex items-center gap-2 p-1 pr-3 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all group"
            >
              <img src={profile.avatarUrl} className="h-8 w-8 rounded-full object-cover" alt="" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-primary-600 transition-colors hidden sm:inline">
                {profile.displayName}
              </span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
