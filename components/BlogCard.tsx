
import React from 'react';
import { BlogPost } from '../types';

interface BlogCardProps {
  post: BlogPost;
  onClick: (post: BlogPost) => void;
}

const BlogCard: React.FC<BlogCardProps> = ({ post, onClick }) => {
  return (
    <div 
      onClick={() => onClick(post)}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 cursor-pointer"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={post.imageUrl}
          alt={post.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-primary-700 backdrop-blur dark:bg-slate-900/90 dark:text-primary-400">
            {post.category}
          </span>
          {post.tags?.slice(0, 2).map(tag => (
            <span key={tag} className="rounded-full bg-black/40 px-3 py-1 text-[10px] font-bold text-white backdrop-blur uppercase tracking-wider">
              {tag}
            </span>
          ))}
        </div>
        <div className="absolute bottom-4 right-4">
          <div className="flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-[10px] font-bold text-white backdrop-blur">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            {post.views > 999 ? `${(post.views / 1000).toFixed(1)}k` : post.views}
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
          <span>{post.date}</span>
          <span>•</span>
          <span>{post.author}</span>
        </div>
        <h3 className="mb-2 text-xl font-bold leading-tight text-slate-900 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400 transition-colors">
          {post.title}
        </h3>
        <p className="mb-4 text-sm leading-relaxed text-slate-600 line-clamp-2 dark:text-slate-400">
          {post.excerpt}
        </p>
        <div className="mt-auto flex items-center text-sm font-semibold text-primary-600 dark:text-primary-400">
          Read More
          <svg className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default BlogCard;
