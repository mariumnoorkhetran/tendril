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

  // Compassionate rewriting state
  const [showRewritingSuggestion, setShowRewritingSuggestion] = useState(false);
  const [rewrittenContent, setRewrittenContent] = useState("");
  const [analyzingContent, setAnalyzingContent] = useState(false);
  const [useRewrittenContent, setUseRewrittenContent] = useState(false);
  const [suggestedTitle, setSuggestedTitle] = useState("");
  const [suggestedContent, setSuggestedContent] = useState("");
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    remaining_requests: number;
    max_requests: number;
    window_seconds: number;
  } | null>(null);

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



  // Handle content change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setNewPostContent(content);
    
    // Clear any previous suggestions when user edits
    if (showRewritingSuggestion) {
      setShowRewritingSuggestion(false);
      setUseRewrittenContent(false);
      setRewrittenContent("");
      setSuggestedTitle("");
      setSuggestedContent("");
    }
    
    // Clear rate limit info when user edits
    setRateLimitInfo(null);
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
      
      // Analyze content for negative words when user clicks publish
      const contentToPost = useRewrittenContent ? rewrittenContent : newPostContent;
      const userId = getUserId();
      
      // Show analyzing state
      setAnalyzingContent(true);
      
      // Combine title and content for analysis
      const fullTextToAnalyze = `${newPostTitle}\n\n${contentToPost}`;
      const analysis = await api.analyzePostContent(fullTextToAnalyze, userId);
      
      // Update rate limit info
      if (analysis.rate_limit) {
        setRateLimitInfo(analysis.rate_limit);
      }
      
      // Check if content contains negative words
      if (analysis.contains_negative_words) {
        if (analysis.suggestion_available) {
          // Parse the rewritten content to separate title and content
          const rewrittenText = analysis.rewritten_text || "";
          const lines = rewrittenText.split('\n').filter(line => line.trim());
          
          let suggestedTitle = newPostTitle;
          let suggestedContent = contentToPost;
          
          if (lines.length >= 2) {
            // First line is likely the title, rest is content
            suggestedTitle = lines[0].trim();
            suggestedContent = lines.slice(1).join('\n').trim();
          } else if (lines.length === 1) {
            // Only one line, treat as content
            suggestedContent = lines[0].trim();
          }
          
          // Show compassionate suggestion
          setSuggestedTitle(suggestedTitle);
          setSuggestedContent(suggestedContent);
          setRewrittenContent(`Title: ${suggestedTitle}\n\nContent: ${suggestedContent}`);
          setShowRewritingSuggestion(true);
          setAnalyzingContent(false);
          setSubmitting(false);
          return; // Don't publish, let user choose
        } else {
          // No suggestion available, block the post
          alert('Your post contains negative talk. Please edit your message to remove negative words before posting.\n\nThis helps create a supportive community environment.');
          setAnalyzingContent(false);
          setSubmitting(false);
          return;
        }
      }
      
      // Content is approved, proceed with publishing
      const finalTitle = useRewrittenContent ? suggestedTitle : newPostTitle;
      const finalContent = useRewrittenContent ? suggestedContent : contentToPost;
      
      const postData = {
        title: finalTitle,
        content: finalContent,
        user_id: getUserId(),
      };
      console.log('Sending post data:', postData);
      const newPost = await api.createPost(postData);
      
      setPosts([newPost, ...posts]);
      setNewPostTitle("");
      setNewPostContent("");
      setShowRewritingSuggestion(false);
      setRewrittenContent("");
      setUseRewrittenContent(false);
      setSuggestedTitle("");
      setSuggestedContent("");
      setRateLimitInfo(null);
      setActiveTab("all-posts"); // Switch to all posts tab to show the new post
    } catch (error: any) {
      console.error('Failed to create post:', error);
      
      // Handle rate limit errors
      if (error.status === 429) {
        const errorDetail = error.detail || {};
        alert(`Rate limit exceeded: ${errorDetail.message || 'Too many analysis requests. Please wait before trying again.'}`);
      } else {
        alert('Failed to create post. Please try again.');
      }
    } finally {
      setSubmitting(false);
      setAnalyzingContent(false);
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
    <div className="m-8 max-w-5xl mx-auto">
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
                    onChange={handleContentChange}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-500"
                    required
                  />
                  {/* Analysis status - only show when analyzing during publish */}
                  {analyzingContent && (
                    <div className="mt-2 text-sm text-gray-600 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#af5f5f] mr-2"></div>
                      Analyzing content for community guidelines...
                    </div>
                  )}
                  
                  {/* Rate Limit Indicator - only show after analysis */}
                  {rateLimitInfo && !analyzingContent && (
                    <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                      <span>📊</span>
                      <span>
                        Analysis requests: {rateLimitInfo.remaining_requests}/{rateLimitInfo.max_requests} remaining
                        {rateLimitInfo.remaining_requests <= 2 && (
                          <span className="text-orange-600 font-medium"> (limit approaching)</span>
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {/* Compassionate Rewriting Suggestion */}
                {showRewritingSuggestion && (
                  <div className="bg-[#fef7f0] border border-[#af5f5f] rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[#af5f5f] text-lg">💝</span>
                      <h4 className="font-semibold text-gray">Compassionate Suggestion</h4>
                      <div className="relative group">
                        <span className="text-gray-400 text-sm cursor-help">ℹ️</span>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                          Suggestions powered by AI
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      We noticed some critical language in your post. To create a supportive community, please either:
                    </p>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">{rewrittenContent}</p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setUseRewrittenContent(true);
                          setNewPostTitle(suggestedTitle);
                          setNewPostContent(suggestedContent);
                        }}
                        className={`px-4 py-2 rounded-lg transition-colors text-sm cursor-pointer ${
                          useRewrittenContent 
                            ? 'bg-green-600 text-white' 
                            : 'bg-[#af5f5f] text-white hover:bg-[#af5f5f]/90'
                        }`}
                      >
                        {useRewrittenContent ? '✓ Using This Version' : 'Use This Version'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowRewritingSuggestion(false);
                          setUseRewrittenContent(false);
                        }}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm cursor-pointer"
                      >
                        Edit Original
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 bg-yellow-50 p-2 rounded">
                      💡 <strong>Note:</strong> You must either use the compassionate version above or edit your message to remove negative words before posting.
                    </div>
                  </div>
                )}

                {/* Warning if negative words are still present and user hasn't chosen compassionate version */}
                {showRewritingSuggestion && !useRewrittenContent && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-red-700">
                      <span>⚠️</span>
                      <span className="text-sm font-medium">Your message still contains negative talk</span>
                    </div>
                    <p className="text-xs text-red-600 mt-1">
                      Please either use the compassionate version above or edit your message to remove negative words.
                    </p>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={submitting || analyzingContent || (showRewritingSuggestion && !useRewrittenContent)}
                  className={`px-6 py-2 rounded-lg transition-colors ${
                    submitting || analyzingContent
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : showRewritingSuggestion && !useRewrittenContent
                      ? 'bg-red-500 cursor-not-allowed'
                      : 'bg-[#af5f5f] hover:bg-[#af5f5f]/90'
                  } text-white cursor-pointer`}
                >
                  {analyzingContent 
                    ? 'Analyzing Content...' 
                    : submitting 
                    ? 'Publishing...' 
                    : showRewritingSuggestion && !useRewrittenContent
                    ? 'Please Choose Version First'
                    : 'Publish Post'
                  }
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
