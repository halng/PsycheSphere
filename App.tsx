
import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import BlogCard from './components/BlogCard';
import PostDetail from './components/PostDetail';
import WriterDashboard from './components/WriterDashboard';
import ProfilePage from './components/ProfilePage';
import { BlogPost, UserRole, Review, UserProfile, Notification } from './types';
import { INITIAL_POSTS } from './constants';

const App: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>(INITIAL_POSTS);
  const [role, setRole] = useState<UserRole>('reader');
  const [isDark, setIsDark] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [currentView, setCurrentView] = useState<'feed' | 'profile'>('feed');
  const [readerFeedTab, setReaderFeedTab] = useState<'published' | 'review' | 'following'>('published');
  const [searchQuery, setSearchQuery] = useState('');
  const [profile, setProfile] = useState<UserProfile>({
    displayName: 'Dr. Sarah Chen',
    suffix: 'PhD',
    bio: 'Neuroscientist specializing in habit formation and cognitive behavioral therapy. Passionate about making complex brain science accessible to everyone.',
    avatarUrl: 'https://ui-avatars.com/api/?name=Sarah+Chen&background=random',
    followedAuthors: []
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const handleSelectPost = (post: BlogPost) => {
    setPosts(prev => prev.map(p => 
      p.id === post.id ? { ...p, views: (p.views || 0) + 1 } : p
    ));
    setSelectedPost(prev => {
      const updatedPost = { ...post, views: (post.views || 0) + 1 };
      return updatedPost;
    });
  };

  const handleLikePost = (postId: string) => {
    setPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p
    ));
    if (selectedPost?.id === postId) {
      setSelectedPost(prev => prev ? { ...prev, likes: (prev.likes || 0) + 1 } : null);
    }
  };

  const handleAddReview = (postId: string, comment: string) => {
    const newReview: Review = {
      id: Math.random().toString(36).substring(7),
      comment,
      author: 'Community Reviewer',
      resolved: false,
      date: new Date().toISOString().split('T')[0]
    };

    setPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, reviews: [newReview, ...p.reviews] } : p
    ));
    
    if (selectedPost?.id === postId) {
      setSelectedPost(prev => prev ? { ...prev, reviews: [newReview, ...prev.reviews] } : null);
    }
  };

  const handleResolveReview = (postId: string, reviewId: string) => {
    setPosts(prev => prev.map(p => 
      p.id === postId ? { 
        ...p, 
        reviews: p.reviews.map(r => r.id === reviewId ? { ...r, resolved: !r.resolved } : r) 
      } : p
    ));
  };

  const handleSaveReviewResponse = (postId: string, reviewId: string, response: string) => {
    setPosts(prev => prev.map(p => 
      p.id === postId ? { 
        ...p, 
        reviews: p.reviews.map(r => r.id === reviewId ? { ...r, authorResponse: response } : r) 
      } : p
    ));
  };

  const handleSavePost = (newPost: BlogPost) => {
    setPosts(prev => {
      const exists = prev.find(p => p.id === newPost.id);
      
      // Notify if transitioning to published or new published post
      const isNewlyPublished = (!exists && newPost.status === 'published') || 
                               (exists && exists.status !== 'published' && newPost.status === 'published');

      if (isNewlyPublished) {
        const newNotification: Notification = {
          id: Math.random().toString(36).substring(7),
          title: 'New Article Published',
          message: `${newPost.author} just published: ${newPost.title}`,
          date: new Date().toISOString().split('T')[0],
          read: false,
          type: 'new_post'
        };
        setNotifications(prevNotifs => [newNotification, ...prevNotifs]);
      }

      if (exists) {
        return prev.map(p => p.id === newPost.id ? newPost : p);
      }
      return [newPost, ...prev];
    });
  };

  const handleFollowAuthor = (authorName: string) => {
    setProfile(prev => ({
      ...prev,
      followedAuthors: [...prev.followedAuthors, authorName]
    }));
  };

  const handleUnfollowAuthor = (authorName: string) => {
    setProfile(prev => ({
      ...prev,
      followedAuthors: prev.followedAuthors.filter(a => a !== authorName)
    }));
  };

  const handleMarkNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleDeletePost = (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  const featuredPost = useMemo(() => posts.find(p => p.status === 'published' && p.isFeatured), [posts]);
  
  const filteredPosts = useMemo(() => {
    return posts.filter(p => {
      let matchesTab = false;
      if (readerFeedTab === 'following') {
        matchesTab = p.status === 'published' && profile.followedAuthors.includes(p.author);
      } else {
        matchesTab = p.status === readerFeedTab;
      }

      const query = searchQuery.toLowerCase().trim();
      
      const matchesSearch = !query || 
        p.title.toLowerCase().includes(query) || 
        p.category.toLowerCase().includes(query) || 
        p.tags?.some(tag => tag.toLowerCase().includes(query));

      // Hide featured post from the main grid if we aren't searching
      const isNotFeaturedHero = p.id !== featuredPost?.id;

      return matchesTab && matchesSearch && (searchQuery ? true : isNotFeaturedHero);
    });
  }, [posts, readerFeedTab, searchQuery, featuredPost, profile.followedAuthors]);

  const relatedPosts = useMemo(() => {
    if (!selectedPost) return [];
    return posts
      .filter(p => p.id !== selectedPost.id && p.status === 'published')
      .filter(p => 
        p.category === selectedPost.category || 
        p.tags?.some(tag => selectedPost.tags?.includes(tag))
      )
      .slice(0, 3);
  }, [selectedPost, posts]);

  return (
    <div className="min-h-screen transition-colors duration-300 bg-slate-50 dark:bg-slate-950">
      <Navbar 
        role={role} 
        setRole={(r) => {
          setRole(r);
          setSelectedPost(null);
          setCurrentView('feed');
          setSearchQuery('');
        }} 
        isDark={isDark} 
        toggleTheme={toggleTheme}
        onHomeClick={() => {
          setSelectedPost(null);
          setCurrentView('feed');
          setSearchQuery('');
        }}
        onProfileClick={() => {
          setSelectedPost(null);
          setCurrentView('profile');
          setSearchQuery('');
        }}
        currentView={currentView}
        profile={profile}
        notifications={notifications}
        onMarkRead={handleMarkNotificationRead}
      />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {role === 'reader' ? (
          <>
            {selectedPost ? (
              <PostDetail 
                post={selectedPost} 
                relatedPosts={relatedPosts}
                onBack={() => setSelectedPost(null)} 
                onLike={handleLikePost}
                onAddReview={handleAddReview}
                onSelectPost={handleSelectPost}
                isFollowing={profile.followedAuthors.includes(selectedPost.author)}
                onFollow={() => handleFollowAuthor(selectedPost.author)}
                onUnfollow={() => handleUnfollowAuthor(selectedPost.author)}
              />
            ) : currentView === 'profile' ? (
              <ProfilePage 
                profile={profile}
                posts={posts}
                onUpdateProfile={setProfile}
                onSelectPost={handleSelectPost}
                onUnfollow={handleUnfollowAuthor}
              />
            ) : (
              <div className="space-y-12">
                <header className="flex flex-col gap-8">
                  <div className="max-w-3xl">
                    <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-6xl">
                      Explore the <span className="text-primary-600 dark:text-primary-400">Human Mind.</span>
                    </h1>
                    <p className="mt-6 text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
                      Discover refined insights into cognitive science, behavior, and mental wellness through professional peer-reviewed research.
                    </p>
                  </div>
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex bg-slate-200/50 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 self-start shadow-sm">
                      <button 
                        onClick={() => setReaderFeedTab('published')}
                        className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${readerFeedTab === 'published' ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                      >
                        Latest Insights
                      </button>
                      <button 
                        onClick={() => setReaderFeedTab('following')}
                        className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${readerFeedTab === 'following' ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                      >
                        Following
                      </button>
                      <button 
                        onClick={() => setReaderFeedTab('review')}
                        className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${readerFeedTab === 'review' ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                      >
                        Peer Review Feed
                      </button>
                    </div>

                    <div className="relative w-full md:w-96 group">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <svg className="w-5 h-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search title, category, or tags..."
                        className="w-full pl-11 pr-12 py-3 rounded-2xl border border-slate-200 bg-white dark:bg-slate-950 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all shadow-sm"
                      />
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery('')}
                          className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </header>

                {/* Featured Section - Only show when NOT searching or if searching specifically for featured */}
                {readerFeedTab === 'published' && featuredPost && !searchQuery && (
                  <section className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">Editor's Featured Choice</span>
                      <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
                    </div>
                    <div 
                      onClick={() => handleSelectPost(featuredPost)}
                      className="group relative cursor-pointer overflow-hidden rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl transition-all hover:shadow-primary-500/5"
                    >
                      <div className="flex flex-col lg:flex-row">
                        <div className="lg:w-3/5 overflow-hidden h-[300px] lg:h-[500px]">
                          <img src={featuredPost.imageUrl} className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="" />
                        </div>
                        <div className="lg:w-2/5 p-8 lg:p-12 flex flex-col justify-center bg-white dark:bg-slate-900">
                          <span className="mb-4 inline-block rounded-full bg-primary-100 px-4 py-1 text-xs font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 uppercase tracking-widest self-start">
                            {featuredPost.category}
                          </span>
                          <h2 className="mb-6 text-3xl font-extrabold leading-tight text-slate-900 lg:text-4xl dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {featuredPost.title}
                          </h2>
                          <p className="mb-8 text-lg text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                            {featuredPost.excerpt}
                          </p>
                          <div className="flex items-center gap-4 mt-auto">
                            <img src={`https://ui-avatars.com/api/?name=${featuredPost.author}&background=random`} className="h-10 w-10 rounded-full ring-2 ring-primary-500/10" alt="" />
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">{featuredPost.author}</p>
                              <p className="text-xs text-slate-500 font-medium">{featuredPost.date}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                <div className="space-y-6">
                  {searchQuery && (
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                        Search Results for "{searchQuery}" ({filteredPosts.length})
                      </h3>
                      <button onClick={() => setSearchQuery('')} className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline">
                        Clear Search
                      </button>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredPosts.map((post) => (
                      <BlogCard 
                        key={post.id} 
                        post={post} 
                        onClick={() => handleSelectPost(post)} 
                      />
                    ))}
                  </div>
                </div>

                {filteredPosts.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in zoom-in-95">
                    <div className="mb-6 rounded-full bg-slate-100 p-10 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-inner">
                      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 dark:text-slate-600"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">No matches found</h3>
                    <p className="mt-2 text-slate-500 dark:text-slate-400 max-w-sm">
                      We couldn't find any articles matching your search query. Try using different keywords or categories.
                    </p>
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="mt-8 px-6 py-2 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20"
                    >
                      Browse All Articles
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <WriterDashboard 
            posts={posts} 
            onSave={handleSavePost} 
            onDelete={handleDeletePost}
            onResolveReview={handleResolveReview}
            onSaveReviewResponse={handleSaveReviewResponse}
          />
        )}
      </main>

      <footer className="mt-20 border-t border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary-600 text-white text-xs font-bold">Ψ</div>
              <span className="ml-2 text-lg font-bold text-slate-900 dark:text-white">PsycheSphere</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
              © 2024 PsycheSphere. Collaborative Psychology & Cognitive Science Platform.
            </p>
            <div className="flex gap-6 text-sm font-bold text-slate-400">
              <a href="#" className="hover:text-primary-500 transition-colors">Privacy</a>
              <a href="#" className="hover:text-primary-500 transition-colors">Terms</a>
              <a href="#" className="hover:text-primary-500 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
