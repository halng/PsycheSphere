
export type PostStatus = 'draft' | 'review' | 'published';

export interface Review {
  id: string;
  comment: string;
  author: string;
  resolved: boolean;
  date: string;
  authorResponse?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  category: string;
  status: PostStatus;
  imageUrl: string;
  views: number;
  likes: number;
  reviews: Review[];
  isFeatured?: boolean;
  tags?: string[];
  metaDescription?: string;
}

export type UserRole = 'reader' | 'writer';

export interface AppState {
  posts: BlogPost[];
  role: UserRole;
  isDark: boolean;
  selectedPost: BlogPost | null;
}
