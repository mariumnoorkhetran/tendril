"use client"
import { useState, useEffect } from "react";
import Link from "next/link";
import { api, ForumPost, Tip } from "../lib/api";

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

export default function Forum() {
  const [activeTab, setActiveTab] = useState("create");
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Tip submission state
  const [newTipContent, setNewTipContent] = useState("");
  const [submittingTip, setSubmittingTip] = useState(false);

  // Load posts from backend
  const loadPosts = async () => {
    try {
      setLoading(true);
      const fetchedPosts = await api.getPosts();
      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create new post
  const createPost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);
      const postData = {
        title: newPostTitle,
        content: newPostContent,
        user_id: getUserId(),
      };
      console.log('Sending post data:', postData);
      const newPost = await api.createPost(postData);
      
      setPosts([newPost, ...posts]);
      setNewPostTitle("");
      setNewPostContent("");
      setActiveTab("all-posts"); // Switch to all posts tab to show the new post
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Create new tip
  const createTip = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTipContent.trim()) {
      alert('Please fill in the tip content');
      return;
    }

    try {
      setSubmittingTip(true);
      const newTip = await api.createTip({
        content: newTipContent,
        author: "Community Member",
        category: "Wellness",
        likes: 0,
        is_featured: false,
      });
      
      // Reset form
      setNewTipContent("");
      
      alert('Tip submitted successfully! It will be reviewed and may appear on the homepage.');
    } catch (error) {
      console.error('Failed to create tip:', error);
      alert('Failed to submit tip. Please try again.');
    } finally {
      setSubmittingTip(false);
    }
  };

  // React to a post
  const handleReaction = async (postId: string) => {
    try {
      const response = await api.reactToPost(postId);
      
      // Update the post in the posts array
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            reactions_count: response.reactions_count,
            user_reacted: response.user_reacted
          };
        }
        return post;
      }));
    } catch (error) {
      console.error('Failed to react to post:', error);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return "Posted today";
    } else if (diffDays === 2) {
      return "Posted yesterday";
    } else if (diffDays <= 7) {
      return `Posted ${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  // Load posts on component mount
  useEffect(() => {
    loadPosts();
  }, []);

  // Filter posts by current user ID
  const currentUserId = getUserId();
  const myPosts = posts.filter(post => post.user_id === currentUserId);

  return (
    <div className="m-8 max-w-5xl">
      {/* Header Section */}
      <div className="text-gray mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold">Forum</h1>
            <p className="text-lg text-gray mt-2">
              Connect with the community and share your hygiene and wellness experiences.
            </p>
          </div>
          <button
            onClick={loadPosts}
            disabled={loading}
            className={`px-4 py-2 rounded-lg transition-colors ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-[#af5f5f] hover:bg-[#af5f5f]/90'
            } text-white text-sm cursor-pointer`}
          >
            {loading ? 'Loading...' : 'Refresh Posts'}
          </button>
        </div>
      </div>

      {/* Forum Content */}
      <div className="bg-[#f9e4bc] rounded-lg p-6 shadow-sm">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-400 mb-6">
          <button
            onClick={() => setActiveTab("submit-tip")}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === "submit-tip"
                ? "text-[#af5f5f] border-b-2 border-[#af5f5f]"
                : "text-gray-500 hover:text-gray-700"
            } cursor-pointer`}
          >
            Submit Tip
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === "create"
                ? "text-[#af5f5f] border-b-2 border-[#af5f5f]"
                : "text-gray-500 hover:text-gray-700"
            } cursor-pointer`}
          >
            Create a Post
          </button>
          <button
            onClick={() => setActiveTab("my-posts")}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === "my-posts"
                ? "text-[#af5f5f] border-b-2 border-[#af5f5f]"
                : "text-gray-500 hover:text-gray-700"
            } cursor-pointer`}
          >
            My Posts
          </button>
          <button
            onClick={() => setActiveTab("all-posts")}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === "all-posts"
                ? "text-[#af5f5f] border-b-2 border-[#af5f5f]"
                : "text-gray-500 hover:text-gray-700"
            } cursor-pointer`}
          >
            All Posts
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === "create" && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray">Create a New Post</h3>
              <form onSubmit={createPost} className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="Post title..."
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-500"
                    required
                  />
                </div>
                <div>
                  <textarea
                    placeholder="Write your post content here..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-500"
                    required
                  />
                </div>
                <button 
                  type="submit"
                  disabled={submitting}
                  className={`px-6 py-2 rounded-lg transition-colors ${
                    submitting 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-[#af5f5f] hover:bg-[#af5f5f]/90'
                  } text-white cursor-pointer`}
                >
                  {submitting ? 'Publishing...' : 'Publish Post'}
                </button>
              </form>
            </div>
          )}

          {activeTab === "submit-tip" && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray">Submit a Wellness Tip</h3>
              <p className="text-gray-600 text-sm mb-4">
                Share your wellness tips with the community! The best tips may be featured on the homepage.
              </p>
              <form onSubmit={createTip} className="space-y-4">
                <div>
                  <textarea
                    placeholder="Write your wellness tip here..."
                    value={newTipContent}
                    onChange={(e) => setNewTipContent(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-500"
                    required
                  />
                </div>
                <button 
                  type="submit"
                  disabled={submittingTip}
                  className={`px-6 py-2 rounded-lg transition-colors ${
                    submittingTip 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-[#af5f5f] hover:bg-[#af5f5f]/90'
                  } text-white cursor-pointer`}
                >
                  {submittingTip ? 'Submitting...' : 'Submit Tip'}
                </button>
              </form>
            </div>
          )}

          {activeTab === "my-posts" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray">My Posts</h3>
              </div>
              {loading ? (
                <p className="text-gray">Loading posts...</p>
              ) : myPosts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">You haven't created any posts yet.</p>
                  <button 
                    onClick={() => setActiveTab("create")}
                    className="mt-4 bg-[#af5f5f] text-white px-4 py-2 rounded-lg hover:bg-[#af5f5f]/90 transition-colors cursor-pointer"
                  >
                    Create Your First Post
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myPosts.map((post) => (
                    <div key={post.id} className="border border-gray-400 rounded-lg p-4 transition-colors">
                      <h4 className="font-semibold text-gray mb-2">{post.title}</h4>
                      <p className="text-gray-600 text-sm mb-3">
                        {post.content.length > 150 
                          ? `${post.content.substring(0, 150)}...` 
                          : post.content
                        }
                      </p>
                      <div className="flex flex-col gap-2 text-sm text-gray-500">
                        <div className="text-gray-600">
                          {post.created_at ? formatDate(post.created_at) : 'Just posted'}
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReaction(post.id!);
                            }}
                            className="flex items-center gap-1 hover:text-yellow-500 transition-colors group cursor-pointer"
                          >
                            <span className={`${post.user_reacted ? "text-yellow-500" : "text-gray-400"} group-hover:text-yellow-500 transition-colors`}>
                              {post.user_reacted ? "⭐" : "☆"}
                            </span>
                            <span className="group-hover:text-yellow-500 transition-colors">{post.reactions_count || 0}</span>
                          </button>
                          <div className="flex items-center gap-1">
                            <span className="text-gray-400">💬</span>
                            <span>{post.comments_count || 0}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Link 
                          href={`/forum/posts/${post.id}`}
                          className="inline-block px-4 py-2 bg-[#af5f5f] text-white rounded-lg hover:bg-[#af5f5f]/90 transition-colors cursor-pointer"
                        >
                          Open Post
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "all-posts" && (
            <div>
              <h3 className="text-xl font-semibold text-gray mb-4">All Posts</h3>
              {loading ? (
                <p className="text-gray">Loading posts...</p>
              ) : posts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No posts available yet.</p>
                  <button 
                    onClick={() => setActiveTab("create")}
                    className="mt-4 bg-[#af5f5f] text-white px-4 py-2 rounded-lg hover:bg-[#af5f5f]/90 transition-colors cursor-pointer"
                  >
                    Create the First Post
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div key={post.id} className="border border-gray-400 rounded-lg p-4 transition-colors">
                      <h4 className="font-semibold text-gray mb-2">{post.title}</h4>
                      <p className="text-gray-600 text-sm mb-3">
                        {post.content.length > 150 
                          ? `${post.content.substring(0, 150)}...` 
                          : post.content
                        }
                      </p>
                      <div className="flex flex-col gap-2 text-sm text-gray-500">
                        <div className="text-gray-600">
                          {post.created_at ? formatDate(post.created_at) : 'Just posted'}
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReaction(post.id!);
                            }}
                            className="flex items-center gap-1 hover:text-yellow-500 transition-colors group cursor-pointer"
                          >
                            <span className={`${post.user_reacted ? "text-yellow-500" : "text-gray-400"} group-hover:text-yellow-500 transition-colors`}>
                              {post.user_reacted ? "⭐" : "☆"}
                            </span>
                            <span className="group-hover:text-yellow-500 transition-colors">{post.reactions_count || 0}</span>
                          </button>
                          <div className="flex items-center gap-1">
                            <span className="text-gray-400">💬</span>
                            <span>{post.comments_count || 0}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Link 
                          href={`/forum/posts/${post.id}`}
                          className="inline-block px-4 py-2 bg-[#af5f5f] text-white rounded-lg hover:bg-[#af5f5f]/90 transition-colors cursor-pointer"
                        >
                          Open Post
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
