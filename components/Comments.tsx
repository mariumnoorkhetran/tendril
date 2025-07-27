"use client"
import { useState, useEffect } from "react";
import { api, Comment } from "@/lib/api";

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

interface CommentsProps {
  postId: string;
}

interface CommentItemProps {
  comment: Comment;
  postId: string;
  onCommentAdded: () => void;
  level?: number;
}

function CommentItem({ comment, postId, onCommentAdded, level = 0 }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showReplies, setShowReplies] = useState(level < 2); // Auto-expand first 2 levels
  const [replies, setReplies] = useState<Comment[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  
  // Compassionate rewriting state for replies
  const [showRewritingSuggestion, setShowRewritingSuggestion] = useState(false);
  const [rewrittenContent, setRewrittenContent] = useState("");
  const [analyzingContent, setAnalyzingContent] = useState(false);
  const [useRewrittenContent, setUseRewrittenContent] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    remaining_requests: number;
    max_requests: number;
    window_seconds: number;
  } | null>(null);

  const currentUserId = getUserId();

  // Load replies for this comment
  const loadReplies = async () => {
    try {
      setLoadingReplies(true);
      const allComments = await api.getComments(postId);
      const commentReplies = allComments.filter(c => c.parent_id === comment.id);
      setReplies(commentReplies);
    } catch (error) {
      console.error('Failed to load replies:', error);
    } finally {
      setLoadingReplies(false);
    }
  };

  // React to a comment
  const handleReaction = async () => {
    try {
      const response = await api.reactToComment(comment.id!);
      // Update the comment in the parent component
      onCommentAdded();
    } catch (error) {
      console.error('Failed to react to comment:', error);
    }
  };

  // Submit a reply
  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyContent.trim()) {
      alert('Please enter a reply');
      return;
    }

    try {
      setSubmitting(true);
      
      // Analyze content for negative words when user clicks post reply
      const contentToPost = useRewrittenContent ? rewrittenContent : replyContent;
      const userId = getUserId();
      
      // Show analyzing state
      setAnalyzingContent(true);
      
      const analysis = await api.analyzeCommentContent(contentToPost, userId);
      
      // Update rate limit info
      if (analysis.rate_limit) {
        setRateLimitInfo(analysis.rate_limit);
      }
      
      // Check if content contains negative words
      if (analysis.contains_negative_words) {
        if (analysis.suggestion_available) {
          // Show compassionate suggestion
          setRewrittenContent(analysis.rewritten_text || "");
          setShowRewritingSuggestion(true);
          setAnalyzingContent(false);
          setSubmitting(false);
          return; // Don't publish, let user choose
        } else {
          // No suggestion available, block the reply
          alert('Your reply contains negative talk. Please edit your message to remove negative words before posting.\n\nThis helps create a supportive community environment.');
          setAnalyzingContent(false);
          setSubmitting(false);
          return;
        }
      }
      
      // Content is approved, proceed with publishing
      const finalContent = useRewrittenContent ? rewrittenContent : contentToPost;
      
      await api.createComment(postId, {
        post_id: postId,
        user_id: currentUserId,
        content: finalContent,
        parent_id: comment.id,
      });
      
      setReplyContent("");
      setShowReplyForm(false);
      setShowRewritingSuggestion(false);
      setRewrittenContent("");
      setUseRewrittenContent(false);
      setRateLimitInfo(null);
      onCommentAdded(); // Refresh comments
    } catch (error: any) {
      console.error('Failed to create reply:', error);
      
      // Handle rate limit errors
      if (error.status === 429) {
        const errorDetail = error.detail || {};
        alert(`Rate limit exceeded: ${errorDetail.message || 'Too many analysis requests. Please wait before trying again.'}`);
      } else {
        alert('Failed to create reply. Please try again.');
      }
    } finally {
      setSubmitting(false);
      setAnalyzingContent(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return "Today";
    } else if (diffDays === 2) {
      return "Yesterday";
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  // Load replies when component mounts
  useEffect(() => {
    if (comment.replies_count && comment.replies_count > 0) {
      loadReplies();
    }
  }, [comment.replies_count]);

  return (
    <div className={`${level > 0 ? 'ml-6 border-l-2 border-[#af5f5f] pl-4' : ''}`}>
      <div className="bg-[#fef7f0] rounded-lg p-4 mb-3 shadow-sm">
        {/* Comment Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">User {comment.user_id?.slice(-4)}</span>
            <span>•</span>
            <span>{comment.created_at ? formatDate(comment.created_at) : 'Just now'}</span>
          </div>
        </div>

        {/* Comment Content */}
        <div className="text-gray-700 mb-3 whitespace-pre-wrap">
          {comment.content}
        </div>

        {/* Comment Actions */}
        <div className="flex items-center gap-4 text-sm">
          <button
            onClick={handleReaction}
            className="flex items-center gap-1 hover:text-yellow-500 transition-colors group cursor-pointer"
          >
            <span className={`${comment.user_reacted ? "text-yellow-500" : "text-gray-400"} group-hover:text-yellow-500 transition-colors`}>
              {comment.user_reacted ? "⭐" : "☆"}
            </span>
            <span className="group-hover:text-yellow-500 transition-colors text-[#af5f5f]">
              {comment.reactions_count || 0} {(comment.reactions_count || 0) === 1 ? 'reaction' : 'reactions'}
            </span>
          </button>

          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="text-[#af5f5f] hover:text-[#af5f5f]/80 transition-colors cursor-pointer"
          >
            Reply
          </button>

          {comment.replies_count && comment.replies_count > 0 ? (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="text-[#af5f5f] hover:text-[#af5f5f]/80 transition-colors cursor-pointer"
            >
              {showReplies ? 'Hide' : 'Show'} {comment.replies_count} {comment.replies_count === 1 ? 'reply' : 'replies'}
            </button>
          ) : null}
        </div>

        {/* Reply Form */}
        {showReplyForm && (
          <form onSubmit={handleSubmitReply} className="mt-3">
            <textarea
              value={replyContent}
              onChange={(e) => {
                setReplyContent(e.target.value);
                // Clear any previous suggestions when user edits
                if (showRewritingSuggestion) {
                  setShowRewritingSuggestion(false);
                  setUseRewrittenContent(false);
                  setRewrittenContent("");
                }
                // Clear rate limit info when user edits
                setRateLimitInfo(null);
              }}
              placeholder="Write your reply..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#af5f5f] focus:border-[#af5f5f] resize-none"
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

            {/* Compassionate Rewriting Suggestion */}
            {showRewritingSuggestion && (
              <div className="bg-[#fef7f0] border border-[#af5f5f] rounded-lg p-3 mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[#af5f5f] text-sm">💝</span>
                  <h4 className="font-semibold text-gray text-sm">Compassionate Suggestion</h4>
                  <div className="relative group">
                    <span className="text-gray-400 text-xs cursor-help">ℹ️</span>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                      Suggestions powered by AI
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-600">
                  We noticed some critical language in your reply. To create a supportive community, please either:
                </p>
                <div className="bg-white rounded-lg p-2 border">
                  <p className="text-gray-700 text-xs whitespace-pre-wrap">{rewrittenContent}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUseRewrittenContent(true);
                      setReplyContent(rewrittenContent);
                    }}
                    className={`px-3 py-1 rounded-lg transition-colors text-xs cursor-pointer ${
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
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-xs cursor-pointer"
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
              <div className="bg-red-50 border border-red-200 rounded-lg p-2 mt-2">
                <div className="flex items-center gap-2 text-red-700">
                  <span>⚠️</span>
                  <span className="text-xs font-medium">Your message still contains negative talk</span>
                </div>
                <p className="text-xs text-red-600 mt-1">
                  Please either use the compassionate version above or edit your message to remove negative words.
                </p>
              </div>
            )}

            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                disabled={submitting || analyzingContent || (showRewritingSuggestion && !useRewrittenContent)}
                className={`px-4 py-2 rounded-lg transition-colors text-sm cursor-pointer ${
                  submitting || analyzingContent
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : showRewritingSuggestion && !useRewrittenContent
                    ? 'bg-red-500 cursor-not-allowed'
                    : 'bg-[#af5f5f] hover:bg-[#af5f5f]/90'
                } text-white`}
              >
                {analyzingContent 
                  ? 'Analyzing Content...' 
                  : submitting 
                  ? 'Posting...' 
                  : showRewritingSuggestion && !useRewrittenContent
                  ? 'Please Choose Version First'
                  : 'Post Reply'
                }
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowReplyForm(false);
                  setReplyContent("");
                  setShowRewritingSuggestion(false);
                  setUseRewrittenContent(false);
                  setRewrittenContent("");
                  setRateLimitInfo(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Replies */}
      {showReplies && comment.replies_count && comment.replies_count > 0 && replies.length > 0 && (
        <div>
          {loadingReplies ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#af5f5f] mx-auto"></div>
            </div>
          ) : (
            replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                postId={postId}
                onCommentAdded={onCommentAdded}
                level={level + 1}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function Comments({ postId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Compassionate rewriting state for main comments
  const [showRewritingSuggestion, setShowRewritingSuggestion] = useState(false);
  const [rewrittenContent, setRewrittenContent] = useState("");
  const [analyzingContent, setAnalyzingContent] = useState(false);
  const [useRewrittenContent, setUseRewrittenContent] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    remaining_requests: number;
    max_requests: number;
    window_seconds: number;
  } | null>(null);

  const currentUserId = getUserId();

  // Load comments
  const loadComments = async () => {
    try {
      setLoading(true);
      const fetchedComments = await api.getComments(postId);
      // Filter to only top-level comments (no parent_id)
      const topLevelComments = fetchedComments.filter(comment => !comment.parent_id);
      setComments(topLevelComments);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create new comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      alert('Please enter a comment');
      return;
    }

    try {
      setSubmitting(true);
      
      // Analyze content for negative words when user clicks post comment
      const contentToPost = useRewrittenContent ? rewrittenContent : newComment;
      const userId = getUserId();
      
      // Show analyzing state
      setAnalyzingContent(true);
      
      const analysis = await api.analyzeCommentContent(contentToPost, userId);
      
      // Update rate limit info
      if (analysis.rate_limit) {
        setRateLimitInfo(analysis.rate_limit);
      }
      
      // Check if content contains negative words
      if (analysis.contains_negative_words) {
        if (analysis.suggestion_available) {
          // Show compassionate suggestion
          setRewrittenContent(analysis.rewritten_text || "");
          setShowRewritingSuggestion(true);
          setAnalyzingContent(false);
          setSubmitting(false);
          return; // Don't publish, let user choose
        } else {
          // No suggestion available, block the comment
          alert('Your comment contains negative talk. Please edit your message to remove negative words before posting.\n\nThis helps create a supportive community environment.');
          setAnalyzingContent(false);
          setSubmitting(false);
          return;
        }
      }
      
      // Content is approved, proceed with publishing
      const finalContent = useRewrittenContent ? rewrittenContent : contentToPost;
      
      await api.createComment(postId, {
        post_id: postId,
        user_id: currentUserId,
        content: finalContent,
      });
      
      setNewComment("");
      setShowRewritingSuggestion(false);
      setRewrittenContent("");
      setUseRewrittenContent(false);
      setRateLimitInfo(null);
      loadComments(); // Refresh comments
    } catch (error: any) {
      console.error('Failed to create comment:', error);
      
      // Handle rate limit errors
      if (error.status === 429) {
        const errorDetail = error.detail || {};
        alert(`Rate limit exceeded: ${errorDetail.message || 'Too many analysis requests. Please wait before trying again.'}`);
      } else {
        alert('Failed to create comment. Please try again.');
      }
    } finally {
      setSubmitting(false);
      setAnalyzingContent(false);
    }
  };

  // Load comments on component mount
  useEffect(() => {
    loadComments();
  }, [postId]);

  return (
    <div className="space-y-6">
      {/* Comment Form */}
      <div className="bg-[#fef7f0] rounded-lg p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray mb-3">Add a Comment</h3>
        <form onSubmit={handleSubmitComment}>
          <textarea
            value={newComment}
            onChange={(e) => {
              setNewComment(e.target.value);
              // Clear any previous suggestions when user edits
              if (showRewritingSuggestion) {
                setShowRewritingSuggestion(false);
                setUseRewrittenContent(false);
                setRewrittenContent("");
              }
              // Clear rate limit info when user edits
              setRateLimitInfo(null);
            }}
            placeholder="Share your thoughts..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#af5f5f] focus:border-[#af5f5f] resize-none"
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

          {/* Compassionate Rewriting Suggestion */}
          {showRewritingSuggestion && (
            <div className="bg-[#fef7f0] border border-[#af5f5f] rounded-lg p-4 mt-3 space-y-3">
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
                We noticed some critical language in your comment. To create a supportive community, please either:
              </p>
              <div className="bg-white rounded-lg p-3 border">
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{rewrittenContent}</p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setUseRewrittenContent(true);
                    setNewComment(rewrittenContent);
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
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
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
            className={`mt-3 px-6 py-2 rounded-lg transition-colors cursor-pointer ${
              submitting || analyzingContent
                ? 'bg-gray-400 cursor-not-allowed' 
                : showRewritingSuggestion && !useRewrittenContent
                ? 'bg-red-500 cursor-not-allowed'
                : 'bg-[#af5f5f] hover:bg-[#af5f5f]/90'
            } text-white`}
          >
            {analyzingContent 
              ? 'Analyzing Content...' 
              : submitting 
              ? 'Posting...' 
              : showRewritingSuggestion && !useRewrittenContent
              ? 'Please Choose Version First'
              : 'Post Comment'
            }
          </button>
        </form>
      </div>

      {/* Comments List */}
      <div>
        <h3 className="text-lg font-semibold text-gray mb-4">
          Comments ({comments.length})
        </h3>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#af5f5f] mx-auto"></div>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                postId={postId}
                onCommentAdded={loadComments}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 