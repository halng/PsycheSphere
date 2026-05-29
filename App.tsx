
import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import BlogCard from './components/BlogCard';
import PostDetail from './components/PostDetail';
import WriterDashboard from './components/WriterDashboard';
import ProfilePage from './components/ProfilePage';
import { BlogPost, UserRole, Review, UserProfile, Notification, WriterAccessRequest } from './types';
import { INITIAL_POSTS } from './constants';
import { isFirebaseConfigured, postService, userService, writerRequestService } from './services/firebaseService';

const CURRENT_USER_ID = 'current-user';

const App: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>(INITIAL_POSTS);
  const [role, setRole] = useState<UserRole>('reader');
  const [isDark, setIsDark] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [currentView, setCurrentView] = useState<'feed' | 'profile' | 'writer-request'>('feed');
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
  const [writerRequest, setWriterRequest] = useState<WriterAccessRequest>({
    name: '',
    email: '',
    expertise: '',
    sampleTopic: '',
    reason: '',
    status: 'none'
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    if (!isFirebaseConfigured) return;

    const loadBackendData = async () => {
      try {
        const [remotePosts, remoteUser] = await Promise.all([
          postService.list(),
          userService.get(CURRENT_USER_ID)
        ]);

        if (remotePosts.length > 0) setPosts(remotePosts);
        if (remoteUser?.profile) setProfile(remoteUser.profile);
        if (remoteUser?.role) setRole(remoteUser.role);
        if (remoteUser?.writerRequest) setWriterRequest(remoteUser.writerRequest);
      } catch (error) {
        console.error('Failed to load Firebase data:', error);
      }
    };

    loadBackendData();
  }, []);

  const persistCurrentUser = async (nextProfile: UserProfile, nextRole: UserRole, nextWriterRequest: WriterAccessRequest) => {
    if (!isFirebaseConfigured) return;

    try {
      await userService.upsert({
        id: CURRENT_USER_ID,
        profile: nextProfile,
        role: nextRole,
        writerRequest: nextWriterRequest
      });
    } catch (error) {
      console.error('Failed to persist Firebase user:', error);
    }
  };

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
    if (isFirebaseConfigured) {
      postService.upsert(newPost).catch(error => console.error('Failed to persist Firebase post:', error));
    }

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
    if (isFirebaseConfigured) {
      postService.delete(id).catch(error => console.error('Failed to delete Firebase post:', error));
    }
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  const handleUpdateProfile = (nextProfile: UserProfile) => {
    setProfile(nextProfile);
    persistCurrentUser(nextProfile, role, writerRequest);
  };

  const handleSubmitWriterRequest = (request: WriterAccessRequest) => {
    const submittedRequest = {
      ...request,
      status: 'pending' as const,
      submittedAt: new Date().toISOString().split('T')[0]
    };
    setWriterRequest(submittedRequest);
    persistCurrentUser(profile, role, submittedRequest);
    if (isFirebaseConfigured) {
      writerRequestService.upsert(CURRENT_USER_ID, submittedRequest).catch(error => console.error('Failed to persist Firebase writer request:', error));
    }
    setNotifications(prev => [{
      id: Math.random().toString(36).substring(7),
      title: 'Writer Access Request Submitted',
      message: `${submittedRequest.name || profile.displayName} requested writer access for ${submittedRequest.expertise || 'new psychology content'}.`,
      date: submittedRequest.submittedAt,
      read: false,
      type: 'system'
    }, ...prev]);
  };

  const handleApproveWriterRequest = () => {
    const approvedAt = new Date().toISOString().split('T')[0];
    const approvedRequest = { ...writerRequest, status: 'approved' as const, approvedAt };
    setWriterRequest(approvedRequest);
    persistCurrentUser(profile, role, approvedRequest);
    if (isFirebaseConfigured) {
      writerRequestService.upsert(CURRENT_USER_ID, approvedRequest).catch(error => console.error('Failed to persist Firebase writer approval:', error));
    }
    setNotifications(prev => [{
      id: Math.random().toString(36).substring(7),
      title: 'Writer Access Approved',
      message: 'Your reader account now has writer permissions. Switch to Writer to create a post.',
      date: approvedAt,
      read: false,
      type: 'system'
    }, ...prev]);
  };

  const isPublicPost = (post: BlogPost) => post.status === 'published' || post.status === 'social_posted';
  const featuredPost = useMemo(() => posts.find(p => isPublicPost(p) && p.isFeatured), [posts]);
  
  const filteredPosts = useMemo(() => {
    return posts.filter(p => {
      let matchesTab = false;
      if (readerFeedTab === 'following') {
        matchesTab = isPublicPost(p) && profile.followedAuthors.includes(p.author);
      } else {
        matchesTab = readerFeedTab === 'published' ? isPublicPost(p) : p.status === readerFeedTab;
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
      .filter(p => p.id !== selectedPost.id && isPublicPost(p))
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
          if (r === 'writer' && writerRequest.status !== 'approved') {
            setSelectedPost(null);
            setCurrentView('writer-request');
            setSearchQuery('');
            return;
          }
          setRole(r);
          persistCurrentUser(profile, r, writerRequest);
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
        canSwitchToWriter={writerRequest.status === 'approved'}
        onRequestWriterAccess={() => {
          setSelectedPost(null);
          setRole('reader');
          setCurrentView('writer-request');
          setSearchQuery('');
        }}
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
            ) : currentView === 'writer-request' ? (
              <section className="mx-auto max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
                  <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="bg-gradient-to-br from-primary-600 to-violet-700 p-8 text-white lg:p-10">
                      <p className="text-xs font-black uppercase tracking-[0.3em] text-primary-100">Reader → Writer</p>
                      <h1 className="mt-4 text-4xl font-black tracking-tight">Request a writer account</h1>
                      <p className="mt-4 text-primary-50 leading-relaxed">Readers can become contributors by filling out this form. After approval, the account gains writer permissions and can switch into Author Studio to create posts.</p>
                      <div className="mt-8 space-y-3 text-sm">
                        {['Submit request', 'Approval grants writer access', 'Switch to Writer', 'Create and preview a new post'].map((step, index) => (
                          <div key={step} className="flex items-center gap-3">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-xs font-black">{index + 1}</span>
                            <span className="font-semibold">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-8 lg:p-10">
                      {writerRequest.status === 'approved' ? (
                        <div className="space-y-6">
                          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                            <p className="font-black">Writer access approved</p>
                            <p className="mt-1 text-sm">Approved on {writerRequest.approvedAt}. You can now switch to Writer and draft a post.</p>
                          </div>
                          <button onClick={() => { setRole('writer'); persistCurrentUser(profile, 'writer', writerRequest); setCurrentView('feed'); }} className="w-full rounded-xl bg-primary-600 px-6 py-3 font-bold text-white shadow-lg shadow-primary-500/20 hover:bg-primary-700">Switch to Writer</button>
                        </div>
                      ) : (
                        <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleSubmitWriterRequest(writerRequest); }}>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <input required value={writerRequest.name} onChange={(e) => setWriterRequest(prev => ({ ...prev, name: e.target.value }))} placeholder="Full name" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-primary-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                            <input required type="email" value={writerRequest.email} onChange={(e) => setWriterRequest(prev => ({ ...prev, email: e.target.value }))} placeholder="Email address" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-primary-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                          </div>
                          <input required value={writerRequest.expertise} onChange={(e) => setWriterRequest(prev => ({ ...prev, expertise: e.target.value }))} placeholder="Area of expertise (e.g., clinical psychology, wellness coaching)" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-primary-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                          <input required value={writerRequest.sampleTopic} onChange={(e) => setWriterRequest(prev => ({ ...prev, sampleTopic: e.target.value }))} placeholder="Sample article topic" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-primary-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                          <textarea required value={writerRequest.reason} onChange={(e) => setWriterRequest(prev => ({ ...prev, reason: e.target.value }))} placeholder="Tell reviewers why you want to write for PsycheSphere..." rows={5} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-primary-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white" />
                          <button type="submit" className="w-full rounded-xl bg-primary-600 px-6 py-3 font-bold text-white shadow-lg shadow-primary-500/20 hover:bg-primary-700">{writerRequest.status === 'pending' ? 'Update Pending Request' : 'Request Writer Account'}</button>
                          {writerRequest.status === 'pending' && (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                              <p className="font-bold">Request pending since {writerRequest.submittedAt}.</p>
                              <p className="mt-1">Demo admin action: approve this request to unlock writer mode.</p>
                              <button type="button" onClick={handleApproveWriterRequest} className="mt-3 rounded-lg bg-amber-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-amber-700">Approve Request</button>
                            </div>
                          )}
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            ) : currentView === 'profile' ? (
              <ProfilePage 
                profile={profile}
                posts={posts}
                onUpdateProfile={handleUpdateProfile}
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

                  {writerRequest.status !== 'approved' && (
                    <div className="rounded-3xl border border-primary-100 bg-primary-50/70 p-5 dark:border-primary-900/40 dark:bg-primary-950/20">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm font-black uppercase tracking-widest text-primary-600 dark:text-primary-400">Want to write for PsycheSphere?</p>
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Fill out a writer account request. Once approved, you can switch from reader to writer and create posts.</p>
                        </div>
                        <button onClick={() => setCurrentView('writer-request')} className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-500/20 hover:bg-primary-700">
                          {writerRequest.status === 'pending' ? 'View Request' : 'Request Writer Access'}
                        </button>
                      </div>
                    </div>
                  )}
                  
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
