export type PostStatus =
  | 'draft'
  | 'ai_generated'
  | 'author_review'
  | 'review'
  | 'reviewer_approved'
  | 'published'
  | 'social_posted';

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
  aiSummary?: string;
  infographicUrl?: string;
  socialCaption?: string;
  socialChannels?: string[];
  authorApprovedAt?: string;
  reviewerApprovedAt?: string;
  publishedAt?: string;
  socialPostedAt?: string;
}

export type UserRole = 'reader' | 'writer';

export interface UserProfile {
  displayName: string;
  suffix: string;
  bio: string;
  avatarUrl: string;
  followedAuthors: string[];
}

export interface WriterAccessRequest {
  name: string;
  email: string;
  expertise: string;
  sampleTopic: string;
  reason: string;
  status: 'none' | 'pending' | 'approved';
  submittedAt?: string;
  approvedAt?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'new_post' | 'review' | 'system';
}

export interface AppState {
  posts: BlogPost[];
  role: UserRole;
  isDark: boolean;
  selectedPost: BlogPost | null;
  profile: UserProfile;
  notifications: Notification[];
}
