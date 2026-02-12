
import React, { useState, useMemo, useRef, useEffect } from 'react';
import ReactQuill from 'react-quill';
import { BlogPost, PostStatus, Review } from '../types';
import { CATEGORIES } from '../constants';
import { polishPsychologyContent, generateExcerpt } from '../services/geminiService';

// Custom Quill Blot for Feedback Markers
const QuillInstance: any = (ReactQuill as any).Quill;
if (QuillInstance) {
  const Inline = QuillInstance.import('blots/inline');
  class FeedbackBlot extends Inline {
    static create(value: string) {
      let node = super.create();
      node.setAttribute('data-review-id', value);
      node.setAttribute('class', 'feedback-marker');
      return node;
    }
    static formats(node: HTMLElement) {
      return node.getAttribute('data-review-id');
    }
  }
  FeedbackBlot.blotName = 'feedback';
  FeedbackBlot.tagName = 'span';
  QuillInstance.register(FeedbackBlot);
}

interface WriterDashboardProps {
  posts: BlogPost[];
  onSave: (post: BlogPost) => void;
  onDelete: (id: string) => void;
  onResolveReview: (postId: string, reviewId: string) => void;
  onSaveReviewResponse: (postId: string, reviewId: string, response: string) => void;
}

const WriterDashboard: React.FC<WriterDashboardProps> = ({ 
  posts, 
  onSave, 
  onDelete, 
  onResolveReview,
  onSaveReviewResponse 
}) => {
  const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [selectionRange, setSelectionRange] = useState<{ index: number, length: number } | null>(null);
  const [showLinkMenu, setShowLinkMenu] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'settings' | 'reviews'>('settings');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const quillRef = useRef<ReactQuill>(null);

  // Content analysis helpers
  const getWordCount = (html: string) => {
    const text = html.replace(/<[^>]*>?/gm, ' ').trim();
    return text ? text.split(/\s+/).length : 0;
  };

  const getReadingTime = (wordCount: number) => {
    const wordsPerMinute = 200;
    const minutes = wordCount / wordsPerMinute;
    return Math.ceil(minutes);
  };

  const wordCount = useMemo(() => getWordCount(editingPost?.content || ''), [editingPost?.content]);
  const readingTime = useMemo(() => getReadingTime(wordCount), [wordCount]);

  const EditorComponent = useMemo(() => {
    if (!ReactQuill) return null;
    const Component = (ReactQuill as any).default || ReactQuill;
    return typeof Component === 'function' || (typeof Component === 'object' && Component.$$typeof) ? Component : null;
  }, []);

  const startNewPost = () => {
    setEditingPost({
      id: Math.random().toString(36).substr(2, 9),
      title: '',
      content: '',
      category: CATEGORIES[0],
      author: 'Current Writer',
      date: new Date().toISOString().split('T')[0],
      status: 'draft',
      imageUrl: `https://picsum.photos/seed/${Math.random()}/800/400`,
      views: 0,
      likes: 0,
      reviews: [],
      isFeatured: false,
      tags: [],
      excerpt: '',
      metaDescription: ''
    });
    setShowPreview(false);
    setIsFocusMode(false);
  };

  const handleRefineGrammar = async () => {
    if (!editingPost?.title || !editingPost?.content) {
      alert("Please provide a title and some content first!");
      return;
    }
    
    setIsEnhancing(true);
    try {
      const refined = await polishPsychologyContent(editingPost.title, editingPost.content);
      // We only update the content, keeping the title and other metadata intact.
      setEditingPost(prev => prev ? ({ ...prev, content: refined }) : null);
    } catch (error) {
      alert("Failed to refine grammar. Please try again.");
    } finally {
      setIsEnhancing(false);
    }
  };

  const savePost = (status: PostStatus) => {
    if (!editingPost?.title || !editingPost?.content) return;
    
    const finalPost: BlogPost = {
      ...editingPost as BlogPost,
      status,
      views: editingPost.views || 0,
      likes: editingPost.likes || 0,
      reviews: editingPost.reviews || [],
      isFeatured: editingPost.isFeatured || false,
      tags: editingPost.tags || [],
      metaDescription: editingPost.metaDescription || '',
      excerpt: editingPost.excerpt || editingPost.content.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...'
    };
    
    onSave(finalPost);
    setEditingPost(null);
  };

  const handleLinkReview = (reviewId: string) => {
    const editor = quillRef.current?.getEditor();
    if (!editor || !selectionRange || selectionRange.length === 0) return;

    editor.formatText(selectionRange.index, selectionRange.length, 'feedback', reviewId);
    setShowLinkMenu(false);
    setSelectionRange(null);
  };

  const jumpToReviewSource = (reviewId: string) => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;

    const content = editor.root.innerHTML;
    const markerStr = `data-review-id="${reviewId}"`;
    const markerIndex = content.indexOf(markerStr);
    
    if (markerIndex !== -1) {
      const blot = Array.from(editor.root.querySelectorAll('.feedback-marker'))
        .find(el => el.getAttribute('data-review-id') === reviewId) as HTMLElement;

      if (blot) {
        blot.scrollIntoView({ behavior: 'smooth', block: 'center' });
        blot.classList.add('pulse-highlight');
        setTimeout(() => blot.classList.remove('pulse-highlight'), 3000);
      }
    }
  };

  const handleReplyChange = (reviewId: string, text: string) => {
    setReplyTextMap(prev => ({ ...prev, [reviewId]: text }));
  };

  const handleReplySubmit = (reviewId: string) => {
    if (!editingPost?.id) return;
    const text = replyTextMap[reviewId] || "";
    onSaveReviewResponse(editingPost.id, reviewId, text);
    
    if (editingPost.reviews) {
      const updatedReviews = editingPost.reviews.map(r => 
        r.id === reviewId ? { ...r, authorResponse: text } : r
      );
      setEditingPost({ ...editingPost, reviews: updatedReviews });
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      const currentTags = editingPost?.tags || [];
      if (!currentTags.includes(tagInput.trim())) {
        setEditingPost(prev => prev ? { ...prev, tags: [...currentTags, tagInput.trim()] } : null);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEditingPost(prev => prev ? { ...prev, tags: (prev.tags || []).filter(t => t !== tagToRemove) } : null);
  };

  const quillModules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, 4, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'video'],
      ['clean']
    ],
  }), []);

  const likesNeeded = 20;
  const minWordsNeeded = 300;
  const currentLikes = editingPost?.likes || 0;
  const unresolvedReviewsCount = (editingPost?.reviews || []).filter(r => !r.resolved).length;
  const isLengthSufficient = wordCount >= minWordsNeeded;
  const canPublish = currentLikes >= likesNeeded && unresolvedReviewsCount === 0 && isLengthSufficient;

  const handleEditorSelection = (range: any) => {
    if (range && range.length > 0) {
      setSelectionRange(range);
      setShowLinkMenu(true);
    } else {
      setTimeout(() => {
        if (!document.activeElement?.closest('.link-menu')) {
          setShowLinkMenu(false);
        }
      }, 200);
    }
  };

  return (
    <div className={`space-y-8 animate-in fade-in duration-500 ${isFocusMode ? 'focus-mode' : ''}`}>
      {!editingPost ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Author Studio</h2>
              <p className="text-slate-500 dark:text-slate-400">Manage your psychological insights and peer reviews.</p>
            </div>
            <button
              onClick={startNewPost}
              className="flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-all hover:-translate-y-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              New Article
            </button>
          </div>

          <div className="grid gap-6">
            {posts.map((post) => (
              <div key={post.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all hover:border-primary-200">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-24 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-800 relative bg-slate-100 dark:bg-slate-800">
                    <img src={post.imageUrl} className="h-full w-full object-cover" alt="" />
                    {post.isFeatured && (
                      <div className="absolute top-1 right-1 bg-amber-500 rounded-full p-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="white"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{post.title}</h4>
                    <div className="mt-1 flex items-center gap-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        post.status === 'published' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        post.status === 'review' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {post.status}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <svg className="text-pink-400" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                        {post.likes}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setEditingPost(post); setShowPreview(false); }}
                    className="p-2 text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                  </button>
                  <button 
                    onClick={() => onDelete(post.id)}
                    className="p-2 text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-0 lg:gap-8 -mt-8 -mx-4 lg:mx-0 min-h-[calc(100vh-80px)]">
          {/* Main Editor Section */}
          <div className={`flex-1 flex flex-col transition-all duration-300 ${isFocusMode ? 'lg:max-w-4xl mx-auto px-4 lg:px-0' : 'px-4 lg:px-0 lg:max-w-[70%]'}`}>
            <header className="py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-slate-50 dark:bg-slate-950 z-20">
              <div className="flex items-center gap-4">
                <button onClick={() => setEditingPost(null)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Status: {editingPost.status}</span>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                    {editingPost.title || 'Untitled Draft'}
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsFocusMode(!isFocusMode)}
                  className={`p-2 rounded-lg transition-colors ${isFocusMode ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900'}`}
                  title="Toggle Focus Mode"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/><path d="M3 12h.01"/><path d="M21 12h.01"/><path d="M12 3h.01"/><path d="M12 21h.01"/><path d="m5.64 5.64.01.01"/><path d="m18.36 18.36.01.01"/><path d="m5.64 18.36.01.01"/><path d="m18.36 5.64.01.01"/></svg>
                </button>
                <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
                  <button onClick={() => setShowPreview(false)} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${!showPreview ? 'bg-white text-primary-600 shadow dark:bg-slate-700 dark:text-white' : 'text-slate-500'}`}>Editor</button>
                  <button onClick={() => setShowPreview(true)} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${showPreview ? 'bg-white text-primary-600 shadow dark:bg-slate-700 dark:text-white' : 'text-slate-500'}`}>Preview</button>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar pt-8 pb-32">
              {!showPreview ? (
                <div className="max-w-4xl mx-auto space-y-8 relative">
                   {showLinkMenu && editingPost.reviews && editingPost.reviews.length > 0 && (
                    <div className="link-menu absolute top-0 right-0 z-50 animate-in zoom-in-95 fade-in duration-200">
                      <div className="rounded-xl bg-white p-2 shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 w-64">
                        <p className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Link to Feedback</p>
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {editingPost.reviews.filter(r => !r.resolved).map(review => (
                            <button
                              key={review.id}
                              onClick={() => handleLinkReview(review.id)}
                              className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group flex items-center justify-between"
                            >
                              <span className="truncate flex-1 text-slate-700 dark:text-slate-300">{review.comment}</span>
                              <svg className="h-3 w-3 text-primary-500 opacity-0 group-hover:opacity-100" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editingPost.title || ''}
                      onChange={(e) => setEditingPost(prev => prev ? ({ ...prev, title: e.target.value }) : null)}
                      placeholder="Add title"
                      className="w-full bg-transparent border-none p-0 text-5xl font-extrabold focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-200 dark:placeholder:text-slate-800"
                    />
                  </div>

                  <div className="min-h-[500px]">
                    <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 mb-4 sticky top-[60px] bg-slate-50 dark:bg-slate-950 z-10">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Article Body</span>
                      <button
                        onClick={handleRefineGrammar}
                        disabled={isEnhancing}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isEnhancing ? 'bg-primary-50 text-primary-400' : 'bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-400'}`}
                      >
                        <svg className={`h-3 w-3 ${isEnhancing ? 'animate-spin' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                        {isEnhancing ? 'Refining Text...' : 'Refine Grammar & Style'}
                      </button>
                    </div>
                    {EditorComponent && (
                      <EditorComponent 
                        ref={quillRef} 
                        theme="snow" 
                        value={editingPost.content || ''} 
                        onChange={(content: string) => setEditingPost(prev => prev ? ({ ...prev, content }) : null)} 
                        onChangeSelection={handleEditorSelection} 
                        modules={quillModules} 
                        className="wp-quill"
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
                  <div className="aspect-video w-full rounded-[2.5rem] overflow-hidden shadow-2xl bg-slate-100 dark:bg-slate-800">
                     <img src={editingPost.imageUrl} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      {editingPost.tags?.map(t => (
                        <span key={t} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold rounded-md uppercase tracking-wider text-slate-500">{t}</span>
                      ))}
                    </div>
                    <h1 className="text-5xl font-extrabold text-slate-900 dark:text-white leading-tight">{editingPost.title}</h1>
                    <div className="flex items-center gap-4 text-slate-400 text-sm">
                       <img src={`https://ui-avatars.com/api/?name=${editingPost.author}&background=random`} className="h-8 w-8 rounded-full" alt="" />
                       <span>{editingPost.author}</span>
                       <span>•</span>
                       <span>{wordCount} words</span>
                       <span>•</span>
                       <span>{readingTime} min read</span>
                    </div>
                  </div>
                  <div className="prose prose-slate lg:prose-2xl dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: editingPost.content || '' }} />
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - WordPress Style Settings */}
          {!isFocusMode && (
            <aside className="w-full lg:w-[30%] border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col h-full sticky top-0">
              <div className="flex border-b border-slate-200 dark:border-slate-800">
                <button 
                  onClick={() => setActiveSidebarTab('settings')}
                  className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${activeSidebarTab === 'settings' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Post Settings
                </button>
                <button 
                  onClick={() => setActiveSidebarTab('reviews')}
                  className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${activeSidebarTab === 'reviews' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Reviews ({unresolvedReviewsCount})
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                {activeSidebarTab === 'settings' ? (
                  <>
                    <section className="space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-tighter text-slate-400">Visibility & Status</h4>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between cursor-pointer group">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Featured Article</span>
                          <div className="relative inline-flex h-5 w-9 items-center rounded-full bg-slate-200 dark:bg-slate-700">
                            <input
                              type="checkbox"
                              className="peer sr-only"
                              checked={editingPost.isFeatured || false}
                              onChange={(e) => setEditingPost(prev => prev ? ({ ...prev, isFeatured: e.target.checked }) : null)}
                            />
                            <div className="h-3 w-3 rounded-full bg-white shadow-sm transition-all translate-x-1 peer-checked:translate-x-5 peer-checked:bg-amber-500"></div>
                          </div>
                        </label>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Category</label>
                          <select
                            value={editingPost.category || ''}
                            onChange={(e) => setEditingPost(prev => prev ? ({ ...prev, category: e.target.value }) : null)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                          >
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>
                    </section>

                    <section className="space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-tighter text-slate-400">Cover Image</h4>
                      <div className="group relative aspect-video w-full rounded-2xl bg-slate-100 dark:bg-slate-900 overflow-hidden border border-slate-200 dark:border-slate-800">
                         <img src={editingPost.imageUrl} className="h-full w-full object-cover transition-opacity group-hover:opacity-50" alt="" />
                         <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <input 
                              type="text" 
                              value={editingPost.imageUrl || ''}
                              onChange={(e) => setEditingPost(prev => prev ? ({ ...prev, imageUrl: e.target.value }) : null)}
                              placeholder="Paste URL..."
                              className="w-[80%] px-3 py-2 rounded-lg bg-white dark:bg-slate-800 text-xs shadow-xl border border-slate-200 dark:border-slate-700"
                            />
                         </div>
                      </div>
                    </section>

                    <section className="space-y-4">
                       <h4 className="text-xs font-black uppercase tracking-tighter text-slate-400">Tags</h4>
                       <div className="space-y-2">
                          <input 
                            type="text" 
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleAddTag}
                            placeholder="Add tags (press Enter)"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:ring-1 focus:ring-primary-500 outline-none"
                          />
                          <div className="flex flex-wrap gap-2">
                             {editingPost.tags?.map(tag => (
                               <span key={tag} className="flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-lg bg-primary-50 text-primary-700 text-[10px] font-bold dark:bg-primary-900/30 dark:text-primary-400">
                                 {tag}
                                 <button onClick={() => removeTag(tag)} className="hover:text-primary-900 dark:hover:text-primary-200 p-0.5">
                                   <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                 </button>
                               </span>
                             ))}
                          </div>
                       </div>
                    </section>

                    <section className="space-y-4">
                       <h4 className="text-xs font-black uppercase tracking-tighter text-slate-400">Excerpt</h4>
                       <textarea
                         value={editingPost.excerpt || ''}
                         onChange={(e) => setEditingPost(prev => prev ? ({ ...prev, excerpt: e.target.value }) : null)}
                         placeholder="Write a brief summary of this post..."
                         className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900 dark:text-white h-24 resize-none"
                       />
                    </section>

                    <section className="space-y-4">
                       <h4 className="text-xs font-black uppercase tracking-tighter text-slate-400">Journal Standard Metrics</h4>
                       <div className="space-y-4 p-4 rounded-2xl bg-slate-900 text-white shadow-xl">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 bg-slate-800/50 rounded-xl border border-white/5">
                              <p className="text-[8px] text-slate-500 uppercase font-black mb-0.5">Words</p>
                              <p className="text-lg font-bold">{wordCount}</p>
                            </div>
                            <div className="p-2 bg-slate-800/50 rounded-xl border border-white/5">
                              <p className="text-[8px] text-slate-500 uppercase font-black mb-0.5">Read Time</p>
                              <p className="text-lg font-bold">{readingTime} <span className="text-[10px] font-normal">min</span></p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-slate-400">Scholarly Depth</span>
                              <span className={isLengthSufficient ? 'text-emerald-400' : 'text-slate-500'}>{wordCount}/{minWordsNeeded}</span>
                            </div>
                            <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                              <div className={`h-full transition-all duration-700 ${isLengthSufficient ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${Math.min((wordCount/minWordsNeeded)*100, 100)}%` }} />
                            </div>
                          </div>
                       </div>
                    </section>
                  </>
                ) : (
                  <div className="space-y-4">
                    {editingPost.reviews && editingPost.reviews.length > 0 ? (
                      editingPost.reviews.map((review) => {
                        const isLinked = editingPost.content?.includes(`data-review-id="${review.id}"`);
                        return (
                          <div key={review.id} className={`p-4 rounded-xl border transition-all ${review.resolved ? 'bg-emerald-50/20 border-emerald-100 opacity-60' : 'bg-slate-50 border-slate-100 dark:bg-slate-900/50 dark:border-slate-800'}`}>
                            <div className="flex justify-between items-start gap-2 mb-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-slate-500">{review.author}</span>
                                {isLinked && (
                                  <button onClick={() => jumpToReviewSource(review.id)} className="p-0.5 rounded text-primary-500 hover:bg-primary-50 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                                  </button>
                                )}
                              </div>
                              <button onClick={() => onResolveReview(editingPost.id!, review.id)} className={`p-1 rounded-md transition-all ${review.resolved ? 'text-emerald-600 bg-emerald-100' : 'text-slate-400 hover:bg-slate-200'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                              </button>
                            </div>
                            <p className={`text-[11px] leading-relaxed mb-3 ${review.resolved ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-300'}`}>
                              {review.comment}
                            </p>
                            {!review.resolved && (
                              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                <textarea
                                  value={replyTextMap[review.id] ?? review.authorResponse ?? ""}
                                  onChange={(e) => handleReplyChange(review.id, e.target.value)}
                                  placeholder="Reply..."
                                  className="w-full text-[10px] p-2 rounded-lg border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 h-16 resize-none"
                                />
                                <button onClick={() => handleReplySubmit(review.id)} className="w-full py-1.5 text-[10px] font-bold bg-primary-600 text-white rounded-lg hover:bg-primary-700">Save Response</button>
                              </div>
                            )}
                            {review.resolved && review.authorResponse && (
                              <p className="text-[10px] italic text-emerald-600 mt-2">Resp: {review.authorResponse}</p>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-20 text-center space-y-2">
                        <div className="mx-auto w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-300">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No reviews yet</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Bar inside Sidebar */}
              <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                <div className="grid grid-cols-2 gap-2 mb-4">
                   <button onClick={() => savePost('draft')} className="py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">Draft</button>
                   <button onClick={() => savePost('review')} className="py-2 text-[10px] font-bold uppercase tracking-widest text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/30 rounded-xl border border-primary-200 dark:border-primary-800">Submit</button>
                </div>
                <div className="relative group">
                   <button onClick={() => savePost('published')} disabled={!canPublish} className="w-full py-3 text-xs font-bold uppercase tracking-widest bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-40 shadow-lg shadow-primary-500/20">Publish Post</button>
                   {!canPublish && (
                    <div className="absolute bottom-full right-0 mb-3 w-full p-3 bg-slate-900 text-white text-[10px] rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-slate-700">
                      <p className="font-bold mb-1 text-amber-400">Missing:</p>
                      <ul className="space-y-1">
                        <li className="flex items-center gap-1"><span className={wordCount >= minWordsNeeded ? 'text-emerald-400' : 'text-slate-500'}>●</span> {minWordsNeeded} Words</li>
                        <li className="flex items-center gap-1"><span className={currentLikes >= likesNeeded ? 'text-emerald-400' : 'text-slate-500'}>●</span> {likesNeeded} Likes</li>
                        <li className="flex items-center gap-1"><span className={unresolvedReviewsCount === 0 ? 'text-emerald-400' : 'text-slate-500'}>●</span> Feedback resolved</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          )}

          {/* Floating Action for Focus Mode */}
          {isFocusMode && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-2 rounded-2xl shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 z-50 animate-in slide-in-from-bottom-8">
               <button onClick={() => setIsFocusMode(false)} className="p-3 text-slate-500 hover:text-primary-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
               </button>
               <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>
               <div className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{wordCount} words • {readingTime} min</div>
               <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>
               <button onClick={() => savePost('draft')} className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest bg-primary-600 text-white rounded-xl shadow-lg shadow-primary-500/20">Quick Save</button>
            </div>
          )}
        </div>
      )}
      <style>{`
        .wp-quill .ql-toolbar.ql-snow {
          border: none;
          border-bottom: 1px solid #e2e8f0;
          padding: 12px 0;
          position: sticky;
          top: 60px;
          background: inherit;
          z-index: 15;
        }
        .dark .wp-quill .ql-toolbar.ql-snow {
          border-bottom-color: #1e293b;
        }
        .wp-quill .ql-container.ql-snow {
          border: none;
          font-family: inherit;
        }
        .wp-quill .ql-editor {
          padding: 32px 0;
          font-size: 1.25rem;
          color: inherit;
        }
        .focus-mode header, .focus-mode .wp-quill .ql-toolbar {
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s;
        }
        .focus-mode:hover header, .focus-mode:hover .wp-quill .ql-toolbar {
          opacity: 1;
          pointer-events: auto;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
        }
      `}</style>
    </div>
  );
};

export default WriterDashboard;
