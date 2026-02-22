
import React, { useState } from 'react';
import { BlogPost, UserProfile } from '../types';
import BlogCard from './BlogCard';

interface ProfilePageProps {
  profile: UserProfile;
  posts: BlogPost[];
  onUpdateProfile: (profile: UserProfile) => void;
  onSelectPost: (post: BlogPost) => void;
  onUnfollow?: (author: string) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ profile, posts, onUpdateProfile, onSelectPost, onUnfollow }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UserProfile>(profile);

  const userPosts = posts.filter(p => p.author === profile.displayName || p.author === `${profile.displayName}, ${profile.suffix}`);

  const handleSave = () => {
    onUpdateProfile(editForm);
    setIsEditing(false);
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="relative">
        <div className="h-48 w-full rounded-[2.5rem] bg-gradient-to-r from-primary-500 to-violet-600 shadow-lg"></div>
        <div className="absolute -bottom-16 left-8 flex items-end gap-6">
          <div className="relative group">
            <img 
              src={profile.avatarUrl} 
              alt={profile.displayName} 
              className="h-32 w-32 rounded-3xl border-4 border-white dark:border-slate-950 object-cover shadow-xl"
            />
            {isEditing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <input 
                  type="text" 
                  value={editForm.avatarUrl}
                  onChange={(e) => setEditForm({...editForm, avatarUrl: e.target.value})}
                  className="w-full px-2 py-1 text-[10px] bg-white rounded"
                  placeholder="Avatar URL"
                />
              </div>
            )}
          </div>
          <div className="mb-4">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">
              {profile.displayName}{profile.suffix ? `, ${profile.suffix}` : ''}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Writer & Psychology Enthusiast</p>
          </div>
        </div>
        <div className="absolute bottom-4 right-8">
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="px-6 py-2 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white font-bold hover:bg-white/30 transition-all"
          >
            {isEditing ? 'Cancel Editing' : 'Edit Profile'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-16">
        <aside className="space-y-8">
          <section className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">About Me</h3>
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Display Name</label>
                  <input 
                    type="text" 
                    value={editForm.displayName}
                    onChange={(e) => setEditForm({...editForm, displayName: e.target.value})}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Suffix (e.g. PhD, MSc)</label>
                  <input 
                    type="text" 
                    value={editForm.suffix}
                    onChange={(e) => setEditForm({...editForm, suffix: e.target.value})}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Bio</label>
                  <textarea 
                    value={editForm.bio}
                    onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm h-32 resize-none"
                  />
                </div>
                <button 
                  onClick={handleSave}
                  className="w-full py-3 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 shadow-lg shadow-primary-500/20 transition-all"
                >
                  Save Changes
                </button>
              </div>
            ) : (
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed italic">
                {profile.bio || "No bio provided yet. Tell the world about your psychological journey!"}
              </p>
            )}
          </section>

          <section className="p-8 rounded-3xl bg-slate-900 text-white shadow-xl">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-6">Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Total Posts</p>
                <p className="text-2xl font-bold">{userPosts.length}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Total Views</p>
                <p className="text-2xl font-bold">
                  {userPosts.reduce((acc, p) => acc + (p.views || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </section>

          {profile.followedAuthors.length > 0 && (
            <section className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Following</h3>
              <div className="space-y-4">
                {profile.followedAuthors.map(author => (
                  <div key={author} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <img src={`https://ui-avatars.com/api/?name=${author}&background=random`} className="h-8 w-8 rounded-full" alt="" />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{author}</span>
                    </div>
                    <button 
                      onClick={() => onUnfollow?.(author)}
                      className="text-[10px] font-bold text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors opacity-0 group-hover:opacity-100"
                    >
                      Unfollow
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </aside>

        <main className="lg:col-span-2 space-y-8">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">My Published Insights</h2>
            <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
          </div>

          {userPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {userPosts.map(post => (
                <BlogCard 
                  key={post.id} 
                  post={post} 
                  onClick={onSelectPost}
                />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-slate-500 dark:text-slate-400 font-medium">You haven't published any articles yet.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProfilePage;
