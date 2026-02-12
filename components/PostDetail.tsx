
import React, { useState } from 'react';
import { BlogPost, Review } from '../types';
import BlogCard from './BlogCard';

interface PostDetailProps {
  post: BlogPost;
  relatedPosts: BlogPost[];
  onBack: () => void;
  onLike: (postId: string) => void;
  onAddReview: (postId: string, comment: string) => void;
  onSelectPost: (post: BlogPost) => void;
}

const PostDetail: React.FC<PostDetailProps> = ({ 
  post, 
  relatedPosts, 
  onBack, 
  onLike, 
  onAddReview,
  onSelectPost
}) => {
  const [newReview, setNewReview] = useState('');
  const [hasLiked, setHasLiked] = useState(false);

  const handleLike = () => {
    if (!hasLiked) {
      onLike(post.id);
      setHasLiked(true);
    }
  };

  const handleReviewSubmit = () => {
    if (!newReview.trim()) return;
    onAddReview(post.id, newReview);
    setNewReview('');
  };

  const unresolvedReviews = post.reviews.filter(r => !r.resolved);

  const shareUrl = window.location.href;
  const shareTitle = encodeURIComponent(post.title);
  
  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${shareTitle}&url=${encodeURIComponent(shareUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <article className="mx-auto max-w-4xl py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 transition-colors self-start"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Back to Feed
        </button>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 border-r border-slate-200 dark:border-slate-800 pr-6 mr-2">
            <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#1DA1F2] transition-colors" title="Share on X">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>
            </a>
            <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#0A66C2] transition-colors" title="Share on LinkedIn">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
            <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#1877F2] transition-colors" title="Share on Facebook">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
          </div>
          
          <div className="flex items-center gap-4 text-sm font-medium text-slate-500 dark:text-slate-400">
             <div className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              {post.views.toLocaleString()}
            </div>
            <button 
              onClick={handleLike}
              className={`flex items-center gap-1 transition-all ${hasLiked ? 'text-pink-500 scale-110' : 'hover:text-pink-500 hover:scale-105'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={hasLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
              {post.likes}
            </button>
          </div>
        </div>
      </div>

      <div className="mb-10 text-center">
        {post.status === 'review' && (
          <div className="mb-6 inline-flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2 border border-amber-100 text-amber-800 dark:bg-amber-900/20 dark:border-amber-900/30 dark:text-amber-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span className="text-sm font-bold uppercase tracking-wider">Community Review Mode</span>
          </div>
        )}
        <div className="flex flex-col items-center gap-4 mb-4">
          <div className="flex gap-2">
            <span className="rounded-full bg-primary-100 px-4 py-1 text-sm font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
              {post.category}
            </span>
            {post.tags?.map(tag => (
              <span key={tag} className="rounded-full bg-slate-100 px-4 py-1 text-sm font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                #{tag}
              </span>
            ))}
          </div>
        </div>
        <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl dark:text-white leading-tight">
          {post.title}
        </h1>
        <div className="flex items-center justify-center gap-4 text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <img src={`https://ui-avatars.com/api/?name=${post.author}&background=random`} className="h-10 w-10 rounded-full" alt="" />
            <span className="font-semibold">{post.author}</span>
          </div>
          <span>•</span>
          <time>{new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</time>
        </div>
      </div>

      <div className="mb-12 overflow-hidden rounded-[2.5rem] shadow-2xl transition-transform hover:scale-[1.01] duration-500 bg-slate-100 dark:bg-slate-800">
        <img src={post.imageUrl} alt={post.title} className="w-full object-cover max-h-[600px]" />
      </div>

      <div className="prose prose-slate prose-xl max-w-none dark:prose-invert">
        <div 
          className="rich-text-content"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </div>

      {/* Post Footer Share Section */}
      <div className="mt-16 py-8 border-y border-slate-200 dark:border-slate-800 flex flex-col items-center gap-6">
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Liked this insight? Share it with your network</p>
        <div className="flex flex-wrap justify-center gap-4">
          <a 
            href={shareLinks.twitter} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 font-bold text-white transition-all hover:bg-black hover:-translate-y-1 shadow-lg shadow-black/10"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>
            Twitter
          </a>
          <a 
            href={shareLinks.linkedin} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-2 rounded-xl bg-[#0A66C2] px-6 py-2.5 font-bold text-white transition-all hover:bg-[#084d91] hover:-translate-y-1 shadow-lg shadow-[#0A66C2]/20"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            LinkedIn
          </a>
          <a 
            href={shareLinks.facebook} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-2 rounded-xl bg-[#1877F2] px-6 py-2.5 font-bold text-white transition-all hover:bg-[#165fc7] hover:-translate-y-1 shadow-lg shadow-[#1877F2]/20"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            Facebook
          </a>
        </div>
      </div>

      {/* Related Posts Section */}
      {relatedPosts.length > 0 && (
        <section className="mt-20">
          <div className="flex items-center gap-4 mb-10">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Deepen Your Understanding</h2>
            <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {relatedPosts.map(related => (
              <BlogCard 
                key={related.id} 
                post={related} 
                onClick={(p) => {
                  onSelectPost(p);
                  scrollToTop();
                }} 
              />
            ))}
          </div>
        </section>
      )}

      <div className="mt-16 border-t border-slate-200 pt-10 dark:border-slate-800">
        <div className="rounded-[2rem] bg-slate-50 p-8 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
          <h3 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">
            {post.status === 'review' ? 'Provide Peer Feedback' : 'Join the Discussion'}
          </h3>
          <p className="mb-6 text-slate-600 dark:text-slate-400">
            {post.status === 'review' 
              ? 'Your insights help the author meet publication standards. Suggest improvements or offer kudos.' 
              : 'What are your thoughts on this topic? Let us know in the comments.'}
          </p>
          <div className="relative">
            <textarea 
              value={newReview}
              onChange={(e) => setNewReview(e.target.value)}
              placeholder={post.status === 'review' ? "What could be improved? (e.g., clarity, sources, structure)..." : "Write a thoughtful comment..."}
              className="w-full rounded-2xl border-slate-200 bg-white p-4 text-slate-900 shadow-sm focus:ring-2 focus:ring-primary-500 dark:bg-slate-950 dark:text-white dark:border-slate-800 outline-none transition-all"
              rows={3}
            />
          </div>
          <div className="mt-4 flex justify-between items-center">
            <span className="text-xs text-slate-400">
              {post.status === 'review' && `${unresolvedReviews.length} active review suggestions`}
            </span>
            <button 
              onClick={handleReviewSubmit}
              disabled={!newReview.trim()}
              className="rounded-xl bg-primary-600 px-6 py-2.5 font-bold text-white hover:bg-primary-700 disabled:opacity-50 transition-all shadow-lg shadow-primary-500/20"
            >
              {post.status === 'review' ? 'Submit Feedback' : 'Post Comment'}
            </button>
          </div>
        </div>

        {post.reviews.length > 0 && (
          <div className="mt-8 space-y-4">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Feedback History</h4>
            {post.reviews.map((review) => (
              <div key={review.id} className={`p-4 rounded-2xl border ${review.resolved ? 'bg-slate-50 border-slate-100 opacity-60 dark:bg-slate-900/20 dark:border-slate-800' : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{review.author}</span>
                    <span className="text-xs text-slate-400">{review.date}</span>
                  </div>
                  {review.resolved && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                      Resolved
                    </span>
                  )}
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{review.comment}</p>
                
                {review.authorResponse && (
                  <div className="mt-4 ml-6 pl-4 border-l-4 border-primary-100 dark:border-primary-900">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full dark:bg-primary-900 dark:text-primary-400">Author Answer</span>
                      <span className="text-[10px] text-slate-400">{post.author}</span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
                      "{review.authorResponse}"
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
};

export default PostDetail;
