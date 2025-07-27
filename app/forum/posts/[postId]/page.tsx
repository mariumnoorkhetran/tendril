"use client"
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { api, ForumPost } from "@/lib/api";
import Comments from "@/components/Comments";

// Utility function to get or create user ID
const getUserId = (): string => {
  if (typeof window === 'undefined') return 'default_user';
  
  let userId = localStorage.getItem('forum_user_id');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('forum_user_id', userId);
  }
  return userId;
};

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.postId as string;
  
  const [post, setPost] = useState<ForumPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load post data
  const loadPost = async () => {
    try {
      setLoading(true);
      setError(null);
      const postData = await api.getPost(postId);
      setPost(postData);
    } catch (error) {
      console.error('Failed to load post:', error);
      setError('Failed to load post. It may not exist or has been deleted.');
    } finally {
      setLoading(false);
    }
  };

  // React to a post
  const handleReaction = async () => {
    if (!post) return;
    
    try {
      const response = await api.reactToPost(post.id!);
      
      setPost({
        ...post,
        reactions_count: response.reactions_count,
        user_reacted: response.user_reacted
      });
    } catch (error) {
      console.error('Failed to react to post:', error);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Load post on component mount
  useEffect(() => {
    if (postId) {
      loadPost();
    }
  }, [postId]);

  if (loading) {
    return (
      <div className="bg-pink min-h-screen">
        <Navbar />
        <div className="m-8 max-w-4xl">
          <div className="bg-[#f9e4bc] rounded-lg p-6 shadow-sm">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded mb-4"></div>
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-300 rounded mb-6"></div>
              <div className="h-32 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="bg-pink min-h-screen">
        <Navbar />
        <div className="m-8 max-w-4xl">
          <div className="bg-[#f9e4bc] rounded-lg p-6 shadow-sm">
            <div className="text-center py-8">
              <h1 className="text-2xl font-bold text-gray mb-4">Post Not Found</h1>
              <p className="text-gray-600 mb-6">{error || 'The post you are looking for does not exist.'}</p>
              <Link 
                href="/forum"
                className="bg-[#af5f5f] text-white px-6 py-2 rounded-lg hover:bg-[#af5f5f]/90 transition-colors cursor-pointer"
              >
                Back to Forum
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-pink min-h-screen">
      <Navbar />
      <div className="m-8 max-w-4xl">
        {/* Back Button */}
        <div className="mb-4">
          <Link 
            href="/forum"
            className="inline-flex items-center text-[#af5f5f] hover:text-[#af5f5f]/80 transition-colors cursor-pointer"
          >
            <span className="mr-2">←</span>
            Back to Forum
          </Link>
        </div>

        {/* Post Content */}
        <div className="bg-[#f9e4bc] rounded-lg p-6 shadow-sm">
          {/* Post Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray mb-2">{post.title}</h1>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-4">
                <span>{post.created_at ? formatDate(post.created_at) : 'Just posted'}</span>
                {post.category && (
                  <span className="bg-[#af5f5f] text-white px-2 py-1 rounded text-xs">
                    {post.category}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Post Content */}
          <div className="mb-6">
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {post.content}
            </div>
          </div>

          {/* Post Actions */}
          <div className="flex items-center gap-6 pt-4 border-t border-gray-300">
            <button
              onClick={handleReaction}
              className="flex items-center gap-2 hover:text-yellow-500 transition-colors group cursor-pointer"
            >
              <span className={`text-xl ${post.user_reacted ? "text-yellow-500" : "text-gray-400"} group-hover:text-yellow-500 transition-colors`}>
                {post.user_reacted ? "⭐" : "☆"}
              </span>
              <span className="group-hover:text-yellow-500 transition-colors text-[#af5f5f]">
                {post.reactions_count || 0} {post.reactions_count === 1 ? 'reaction' : 'reactions'}
              </span>
            </button>
            
            <div className="flex items-center gap-2 text-[#af5f5f]">
              <span className="text-gray-400">💬</span>
              <span>{post.comments_count || 0} {post.comments_count === 1 ? 'comment' : 'comments'}</span>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-6 bg-[#f9e4bc] rounded-lg p-6 shadow-sm">
          <Comments postId={postId} />
        </div>
      </div>
    </div>
  );
} 