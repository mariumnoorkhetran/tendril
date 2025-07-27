const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Types
export interface Task {
  id?: string;  // Changed from number to string (UUID)
  title: string;
  description?: string;
  completed: boolean;
  due_date?: string;
  completion_history?: Record<string, boolean>;  // New field for tracking completion by date
}



export interface ForumPost {
  id?: string;  // Changed from number to string (UUID)
  title: string;
  content: string;
  user_id?: string;
  author?: string;
  category?: string;
  created_at?: string;
  comments_count?: number;
  reactions_count?: number;
  user_reacted?: boolean;
}

export interface Comment {
  id?: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_id?: string;
  created_at?: string;
  replies_count?: number;
  reactions_count?: number;
  user_reacted?: boolean;
}

export interface StreakSummary {
  current_streak: number;
  longest_streak: number;
  is_paused: boolean;
  last_completion_date?: string;
  days_since_last_completion?: number;
  total_completion_days: number;
}

export interface Tip {
  id?: string;
  content: string;
  author: string;
  category: string;
  likes: number;
  created_at?: string;
  is_featured: boolean;
}

// Calendar response type
export interface CalendarDayResponse {
  date: string;
  tasks: Task[];
  completed_count: number;
  total_count: number;
  completion_rate: number;
}

// API Client
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    return this.request<{ status: string; timestamp: string }>('/health');
  }

  // Tasks API
  async getTasks(): Promise<Task[]> {
    return this.request<Task[]>('/api/tasks');
  }

  async createTask(task: Omit<Task, 'id'>): Promise<Task> {
    return this.request<Task>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async updateTask(id: string, task: Task): Promise<Task> {
    return this.request<Task>(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(task),
    });
  }

  async deleteTask(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // Calendar API
  async getCalendarDay(date: string): Promise<CalendarDayResponse> {
    return this.request<CalendarDayResponse>(`/api/calendar/${date}`);
  }

  async updateTaskCompletion(taskId: string, date: string, completed: boolean): Promise<{ message: string; task_id: string; date: string; completed: boolean }> {
    return this.request(`/api/tasks/${taskId}/complete/${date}?completed=${completed}`, {
      method: 'PUT',
    });
  }



  // Forum Posts API
  async getPosts(): Promise<ForumPost[]> {
    return this.request<ForumPost[]>('/api/posts');
  }

  async getPost(postId: string): Promise<ForumPost> {
    return this.request<ForumPost>(`/api/posts/${postId}`);
  }

  async analyzePostContent(content: string, userId?: string): Promise<{
    contains_negative_words: boolean;
    found_words: string[];
    suggestion_available: boolean;
    rewritten_text: string | null;
    error: string | null;
    rate_limit?: {
      remaining_requests: number;
      max_requests: number;
      window_seconds: number;
    };
  }> {
    return this.request('/api/posts/analyze', {
      method: 'POST',
      body: JSON.stringify({ content, user_id: userId }),
    });
  }

  async analyzeCommentContent(content: string, userId?: string): Promise<{
    contains_negative_words: boolean;
    found_words: string[];
    suggestion_available: boolean;
    rewritten_text: string | null;
    error: string | null;
    rate_limit?: {
      remaining_requests: number;
      max_requests: number;
      window_seconds: number;
    };
  }> {
    return this.request('/api/comments/analyze', {
      method: 'POST',
      body: JSON.stringify({ content, user_id: userId }),
    });
  }

  async createPost(post: Omit<ForumPost, 'id' | 'created_at'>): Promise<ForumPost> {
    return this.request<ForumPost>('/api/posts', {
      method: 'POST',
      body: JSON.stringify(post),
    });
  }

  async reactToPost(postId: string): Promise<{ message: string; post_id: string; reactions_count: number; user_reacted: boolean }> {
    return this.request(`/api/posts/${postId}/react`, {
      method: 'POST',
    });
  }

  // Comments API
  async getComments(postId: string): Promise<Comment[]> {
    return this.request<Comment[]>(`/api/posts/${postId}/comments`);
  }

  async createComment(postId: string, comment: Omit<Comment, 'id' | 'created_at'>): Promise<Comment> {
    return this.request<Comment>(`/api/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify(comment),
    });
  }

  async reactToComment(commentId: string): Promise<{ message: string; comment_id: string; reactions_count: number; user_reacted: boolean }> {
    return this.request(`/api/comments/${commentId}/react`, {
      method: 'POST',
    });
  }

  // Streak API
  async getStreak(): Promise<StreakSummary> {
    return this.request<StreakSummary>('/api/streak');
  }

  async completeTaskForStreak(completionDate: string): Promise<{ message: string; streak_data: any }> {
    return this.request(`/api/streak/complete?completion_date=${completionDate}`, {
      method: 'POST',
    });
  }

  // Tips API
  async getTips(): Promise<Tip[]> {
    return this.request<Tip[]>('/api/tips');
  }

  async getFeaturedTips(): Promise<Tip[]> {
    return this.request<Tip[]>('/api/tips/featured');
  }

  async getRandomTip(): Promise<Tip> {
    return this.request<Tip>('/api/tips/random');
  }

  async createTip(tip: Omit<Tip, 'id' | 'created_at'>): Promise<Tip> {
    return this.request<Tip>('/api/tips', {
      method: 'POST',
      body: JSON.stringify(tip),
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export individual functions for easier use
export const api = {
  // Health
  healthCheck: () => apiClient.healthCheck(),
  
  // Tasks
  getTasks: () => apiClient.getTasks(),
  createTask: (task: Omit<Task, 'id'>) => apiClient.createTask(task),
  updateTask: (id: string, task: Task) => apiClient.updateTask(id, task),
  deleteTask: (id: string) => apiClient.deleteTask(id),
  
  // Calendar
  getCalendarDay: (date: string) => apiClient.getCalendarDay(date),
  updateTaskCompletion: (taskId: string, date: string, completed: boolean) => apiClient.updateTaskCompletion(taskId, date, completed),
  

  
  // Posts
  getPosts: () => apiClient.getPosts(),
  getPost: (postId: string) => apiClient.getPost(postId),
  analyzePostContent: (content: string, userId?: string) => apiClient.analyzePostContent(content, userId),
  createPost: (post: Omit<ForumPost, 'id' | 'created_at'>) => apiClient.createPost(post),
  reactToPost: (postId: string) => apiClient.reactToPost(postId),
  
  // Comments
  analyzeCommentContent: (content: string, userId?: string) => apiClient.analyzeCommentContent(content, userId),
  
  // Comments
  getComments: (postId: string) => apiClient.getComments(postId),
  createComment: (postId: string, comment: Omit<Comment, 'id' | 'created_at'>) => apiClient.createComment(postId, comment),
  reactToComment: (commentId: string) => apiClient.reactToComment(commentId),
  
  // Streak
  getStreak: () => apiClient.getStreak(),
  completeTaskForStreak: (completionDate: string) => apiClient.completeTaskForStreak(completionDate),
  
  // Tips
  getTips: () => apiClient.getTips(),
  getFeaturedTips: () => apiClient.getFeaturedTips(),
  getRandomTip: () => apiClient.getRandomTip(),
  createTip: (tip: Omit<Tip, 'id' | 'created_at'>) => apiClient.createTip(tip),
}; 