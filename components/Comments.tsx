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
      await api.createComment(postId, {
        post_id: postId,
        user_id: currentUserId,
        content: replyContent,
        parent_id: comment.id,
      });
      
      setReplyContent("");
      setShowReplyForm(false);
      onCommentAdded(); // Refresh comments
    } catch (error) {
      console.error('Failed to create reply:', error);
      alert('Failed to create reply. Please try again.');
    } finally {
      setSubmitting(false);
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
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write your reply..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#af5f5f] focus:border-[#af5f5f] resize-none"
              required
            />
            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                disabled={submitting}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  submitting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-[#af5f5f] hover:bg-[#af5f5f]/90'
                } text-white text-sm cursor-pointer`}
              >
                {submitting ? 'Posting...' : 'Post Reply'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowReplyForm(false);
                  setReplyContent("");
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
      await api.createComment(postId, {
        post_id: postId,
        user_id: currentUserId,
        content: newComment,
      });
      
      setNewComment("");
      loadComments(); // Refresh comments
    } catch (error) {
      console.error('Failed to create comment:', error);
      alert('Failed to create comment. Please try again.');
    } finally {
      setSubmitting(false);
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
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#af5f5f] focus:border-[#af5f5f] resize-none"
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className={`mt-3 px-6 py-2 rounded-lg transition-colors ${
              submitting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-[#af5f5f] hover:bg-[#af5f5f]/90'
            } text-white cursor-pointer`}
          >
            {submitting ? 'Posting...' : 'Post Comment'}
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