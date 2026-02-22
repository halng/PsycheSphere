
import { BlogPost } from './types';

export const CATEGORIES = [
  'Cognitive',
  'Developmental',
  'Social',
  'Clinical',
  'Neuroscience',
  'Wellness'
];

export const INITIAL_POSTS: BlogPost[] = [
  {
    id: '1',
    title: 'The Neuroscience of Habit Formation',
    excerpt: 'Understanding how our brains create and break loops can transform how we approach personal growth.',
    content: `<p>Habits are the brain's way of saving effort. When you repeat a behavior, the brain creates a shortcut in the basal ganglia. This "habit loop" consists of a cue, a routine, and a reward.</p><p>To break a habit, one must identify the underlying cue and provide a different routine that leads to a similar reward. This is known as the Golden Rule of Habit Change. In this article, we explore how neuroplasticity plays a crucial role in rewiring these subconscious patterns.</p>`,
    author: 'Dr. Sarah Chen',
    date: '2024-05-10',
    category: 'Neuroscience',
    status: 'published',
    imageUrl: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=1200',
    views: 1240,
    likes: 45,
    reviews: [],
    isFeatured: true,
    metaDescription: 'Discover the science behind how habits are formed and how to change them effectively.'
  },
  {
    id: '2',
    title: 'Attachment Theory in Adult Relationships',
    excerpt: 'How early childhood bonds influence our romantic connections and emotional security in later life.',
    content: `<p>Developed by John Bowlby and Mary Ainsworth, attachment theory suggests that the care we receive as infants creates a 'blueprint' for how we interact with others as adults. There are four primary attachment styles: Secure, Anxious-Preoccupied, Dismissive-Avoidant, and Fearful-Avoidant.</p><p>Understanding your own attachment style is the first step toward building healthier, more secure relationships. It allows you to recognize triggers and communicate your needs more effectively.</p>`,
    author: 'Mark Sullivan',
    date: '2024-05-12',
    category: 'Developmental',
    status: 'published',
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800',
    views: 856,
    likes: 32,
    reviews: [],
    metaDescription: 'Explore how early childhood attachment styles shape adult romantic relationships.'
  },
  {
    id: '3',
    title: 'The Psychology of Resilience',
    excerpt: 'Building mental fortitude in an increasingly complex world through proven cognitive frameworks.',
    author: 'Elena Rodriguez',
    date: '2024-05-20',
    category: 'Wellness',
    status: 'review',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800',
    views: 120,
    likes: 18,
    content: '<p>Resilience is not a fixed trait; it is a dynamic process of adaptation. By practicing cognitive reframing, we can change our relationship with stress.</p>',
    metaDescription: 'Learn about the psychological foundations of resilience and how to build mental strength.',
    reviews: [
      {
        id: 'r1',
        author: 'Prof. Miller',
        comment: 'Please add a section on the biological markers of resilience.',
        resolved: true,
        date: '2024-05-21',
        authorResponse: 'Thank you! I have added a new paragraph discussing cortisol levels and neuroplasticity in the prefrontal cortex.'
      }
    ]
  }
];
