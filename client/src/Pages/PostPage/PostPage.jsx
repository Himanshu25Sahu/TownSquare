

import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { useTheme } from "../../components/ThemeProvider";
import "./PostPage.css";
import { Vote, Send, ChevronLeft, ChevronRight } from "lucide-react";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import "react-toastify/dist/ReactToastify.css";
import { getTimeAgo } from "../HomePage/Helpers";

const PostPage = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [userVote, setUserVote] = useState(null);
  const [upVotes, setUpVotes] = useState(0);
  const [downVotes, setDownVotes] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const { isDarkMode } = useTheme();

  // Image carousel state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [showCommentAnimation, setShowCommentAnimation] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [pollResults, setPollResults] = useState(null);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);

  const { userData, token } = useSelector((state) => state.user);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);

        if (!token) {
          toast.error("Authentication required");
          return;
        }

        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_BASEURL}/post/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          setPost(response.data.post);
          setUpVotes(response.data.post.upVotes || 0);
          setDownVotes(response.data.post.downVotes || 0);

          const votedPosts = JSON.parse(
            localStorage.getItem("votedPosts") || "{}"
          );
          if (votedPosts[id]) {
            setUserVote(votedPosts[id]);
          }

          const bookmarkedPosts = JSON.parse(
            localStorage.getItem("bookmarkedPosts") || "[]"
          );
          setIsBookmarked(bookmarkedPosts.includes(id));

          const commentsResponse = await axios.get(
            `${import.meta.env.VITE_BACKEND_BASEURL}/post/${id}/comments`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (commentsResponse.data.success) {
            setComments(commentsResponse.data.comments);
          }

          if (response.data.post.poll) {
            const hasVoted = response.data.post.poll.options.some(
              (option) => option.voters && option.voters.includes(userData?._id)
            );
            setHasVoted(hasVoted);

            if (hasVoted) {
              setPollResults(response.data.post.poll);
            }
          }
        } else {
          setError("Failed to load post");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Error loading post");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, token, userData]);

  const handleUpvote = async (e) => {
    e.stopPropagation();

    if (!token) {
      toast.error("Please log in to vote");
      return;
    }

    try {
      const endpoint =
        userVote === "upvote"
          ? `${import.meta.env.VITE_BACKEND_BASEURL}/post/remove/${id}`
          : `${import.meta.env.VITE_BACKEND_BASEURL}/post/up/${id}`;

      const response = await axios.post(
        endpoint,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setUpVotes(response.data.upVotes);
        setDownVotes(response.data.downVotes);

        const newVote = userVote === "upvote" ? null : "upvote";
        setUserVote(newVote);

        const votedPosts = JSON.parse(
          localStorage.getItem("votedPosts") || "{}"
        );
        votedPosts[id] = newVote;
        localStorage.setItem("votedPosts", JSON.stringify(votedPosts));

        if (newVote === "upvote") {
          setIsAnimating(true);
          setTimeout(() => setIsAnimating(false), 1000);
        }
      }
    } catch (error) {
      console.error("Error upvoting post:", error);
    }
  };

  const handleDownvote = async (e) => {
    e.stopPropagation();

    if (!token) {
      toast.error("Please log in to vote");
      return;
    }

    try {
      const endpoint =
        userVote === "downvote"
          ? `${import.meta.env.VITE_BACKEND_BASEURL}/post/remove/${id}`
          : `${import.meta.env.VITE_BACKEND_BASEURL}/post/down/${id}`;

      const response = await axios.post(
        endpoint,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setUpVotes(response.data.upVotes);
        setDownVotes(response.data.downVotes);

        const newVote = userVote === "downvote" ? null : "downvote";
        setUserVote(newVote);

        const votedPosts = JSON.parse(
          localStorage.getItem("votedPosts") || "{}"
        );
        votedPosts[id] = newVote;
        localStorage.setItem("votedPosts", JSON.stringify(votedPosts));
      }
    } catch (error) {
      console.error("Error downvoting post:", error);
    }
  };

  const handleBookmark = (e) => {
    e.stopPropagation();

    if (!token) {
      toast.error("Please log in to bookmark");
      return;
    }

    const bookmarkedPosts = JSON.parse(
      localStorage.getItem("bookmarkedPosts") || "[]"
    );

    if (isBookmarked) {
      const updatedBookmarks = bookmarkedPosts.filter(
        (postId) => postId !== id
      );
      localStorage.setItem("bookmarkedPosts", JSON.stringify(updatedBookmarks));
    } else {
      bookmarkedPosts.push(id);
      localStorage.setItem("bookmarkedPosts", JSON.stringify(bookmarkedPosts));
    }

    setIsBookmarked(!isBookmarked);
    toast.success(
      isBookmarked ? "Removed from bookmarks" : "Added to bookmarks"
    );
  };

  const addComment = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("Please log in to comment");
      return;
    }

    if (!commentText.trim()) {
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_BASEURL}/post/comment`,
        {
          postId: id,
          message: commentText,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setCommentText("");
        const commentsResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_BASEURL}/post/${id}/comments`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (commentsResponse.data.success) {
          setComments(commentsResponse.data.comments);
          setShowCommentAnimation(true);
          setTimeout(() => setShowCommentAnimation(false), 1500);
          toast.success("Comment added successfully!");
        }
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error(error.response?.data?.message || "Error adding comment");
    }
  };

  const handlePollVote = async () => {
    if (selectedOption === null || !token || !post?.poll || !userData?._id) {
      toast.error("Please select an option to vote");
      return;
    }

    setIsSubmittingVote(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_BASEURL}/post/${id}/vote`,
        {
          option: post.poll.options[selectedOption]._id,
          userId: userData._id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setHasVoted(true);
        setPollResults(response.data.updatedPost?.poll);
        toast.success("Your vote has been recorded!");
      }
    } catch (error) {
      console.error("Error voting in poll:", error);
      toast.error(error.response?.data?.message || "Error voting in poll");
    } finally {
      setIsSubmittingVote(false);
    }
  };

  // Image carousel handlers
  const nextImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === post.attachments.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? post.attachments.length - 1 : prevIndex - 1
    );
  };

  const goToImage = (index) => {
    setCurrentImageIndex(index);
  };

  if (loading) {
    return (
      <div className="xai-post-loading-container">
        <div className="xai-post-loading-spinner"></div>
        <p>Loading post...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="xai-post-error-container">
        <div className="xai-post-error-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h3>Error loading post</h3>
        <p>{error}</p>
        <button
          className="xai-post-retry-button"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="xai-post-empty-container">
        <div className="xai-post-empty-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h3>Post not found</h3>
        <p>
          The post you're looking for doesn't exist or may have been deleted.
        </p>
      </div>
    );
  }

  const totalPollVotes =
    post.poll?.options.reduce((sum, option) => sum + (option.votes || 0), 0) ||
    0;
  const imageAttachments =
    post.attachments?.filter((attachment) =>
      attachment.fileType?.startsWith("image/")
    ) || [];

  return (
    <div className={`xai-post-page ${isDarkMode ? "dark" : ""}`}>
      <div className="xai-post-cyber-grid"></div>
      <div className="xai-post-container">
        <div className="xai-post-card">
          <div className="xai-post-header">
            <div className="xai-post-avatar-container">
              {post.createdBy?.avatar ? (
                <img
                  src={post.createdBy.avatar || "/placeholder.svg"}
                  alt={post.createdBy.username}
                  className="xai-post-avatar"
                />
              ) : (
                <div className="xai-post-avatar">
                  <span>{post.createdBy?.username?.charAt(0) || "U"}</span>
                </div>
              )}
              <div className="xai-post-avatar-glow"></div>
            </div>
            <div className="xai-post-author-info">
              <div className="xai-post-author-name-container">
                <h3 className="xai-post-author-name">
                  {post.createdBy?.username || "Anonymous"}
                </h3>
                <span className={`xai-post-type xai-post-type-${post.type}`}>
                  {post.type}
                </span>
              </div>
              <div className="xai-post-meta">
                <span className="xai-post-timestamp">
                  {getTimeAgo(post.createdAt)}
                </span>
                <span className="xai-post-sent-from">Post sent from Mars</span>
              </div>
            </div>
          </div>

          <div className="xai-post-content">
            <h2 className="xai-post-title">{post.title}</h2>
            <p className="xai-post-text">{post.description}</p>

            {imageAttachments.length > 0 && (
              <div className="xai-post-image-carousel">
                <div className="xai-post-carousel-container">
                  <div
                    className="xai-post-carousel-track"
                    style={{
                      transform: `translateX(-${currentImageIndex * 100}%)`,
                      width: `${100}%`,
                    }}
                  >
                    {imageAttachments.map((image, index) => (
                      <div key={image._id} className="xai-post-carousel-slide">
                        <img
                          src={image.url}
                          alt={`Post attachment ${index + 1}`}
                          className="xai-post-carousel-image"
                          loading="lazy" // Lazy load images to improve performance
                          onError={(e) => {
                            e.target.src = "/placeholder.svg"; // Fallback for broken images
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  {imageAttachments.length > 1 && (
                    <>
                      <button
                        className="xai-post-carousel-button xai-post-carousel-button-prev"
                        onClick={prevImage}
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="xai-post-carousel-icon" />
                      </button>
                      <button
                        className="xai-post-carousel-button xai-post-carousel-button-next"
                        onClick={nextImage}
                        aria-label="Next image"
                      >
                        <ChevronRight className="xai-post-carousel-icon" />
                      </button>

                      <div className="xai-post-carousel-indicators">
                        {imageAttachments.map((_, index) => (
                          <button
                            key={index}
                            className={`xai-post-carousel-indicator ${
                              currentImageIndex === index ? "active" : ""
                            }`}
                            onClick={() => goToImage(index)}
                            aria-label={`Go to image ${index + 1}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {post.poll && post.type === "poll" && (
              <div className="xai-post-poll-section">
                <div className="xai-post-poll-header">
                  <h3 className="xai-post-poll-title">{post.poll.question}</h3>
                  <div className="xai-post-poll-meta">
                    <span
                      className={`xai-post-poll-status ${
                        post.poll.status === "active" ? "active" : ""
                      }`}
                    >
                      {post.poll.status === "active"
                        ? "Active Poll"
                        : "Closed Poll"}
                    </span>
                    <span className="xai-post-poll-votes">
                      <Vote className="xai-post-poll-icon" />
                      {totalPollVotes} votes
                    </span>
                  </div>
                </div>

                {hasVoted || post.poll.status !== "active" ? (
                  <div className="xai-post-poll-results">
                    {post.poll.options.map((option, index) => {
                      const percentage =
                        totalPollVotes > 0
                          ? Math.round((option.votes / totalPollVotes) * 100)
                          : 0;
                      const colorClass = `xai-post-poll-color-${index % 4}`;

                      return (
                        <div key={option._id} className="xai-post-poll-result">
                          <div className="xai-post-poll-result-header">
                            <span className="xai-post-poll-result-label">
                              {option.text}
                            </span>
                            <span
                              className={`xai-post-poll-result-percentage ${colorClass}`}
                            >
                              {percentage}%
                            </span>
                          </div>
                          <div className="xai-post-poll-result-bar">
                            <div
                              className={`xai-post-poll-result-progress ${colorClass}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <div className="xai-post-poll-result-votes">
                            <span>{option.votes || 0} votes</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="xai-post-poll-options">
                    {post.poll.options.map((option, index) => (
                      <div
                        key={option._id}
                        className={`xai-post-poll-option ${
                          selectedOption === index ? "selected" : ""
                        }`}
                        onClick={() => setSelectedOption(index)}
                      >
                        <div className="xai-post-poll-radio-container">
                          <input
                            type="radio"
                            id={`poll-option-${option._id}`}
                            name="poll-options"
                            checked={selectedOption === index}
                            onChange={() => setSelectedOption(index)}
                            className="xai-post-poll-radio"
                          />
                          <span className="xai-post-poll-radio-checkmark"></span>
                        </div>
                        <label
                          htmlFor={`poll-option-${option._id}`}
                          className="xai-post-poll-option-label"
                        >
                          {option.text}
                        </label>
                      </div>
                    ))}

                    <button
                      className={`xai-post-poll-submit ${
                        selectedOption === null ? "disabled" : ""
                      }`}
                      disabled={selectedOption === null || isSubmittingVote}
                      onClick={handlePollVote}
                    >
                      {isSubmittingVote ? (
                        <>
                          <span className="xai-post-poll-submit-spinner"></span>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Vote className="xai-post-poll-submit-icon" />
                          Submit Vote
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="xai-post-actions">
              <div className="xai-post-action-buttons">
                <button
                  className={`xai-post-action-button ${
                    userVote === "upvote" ? "xai-post-active" : ""
                  }`}
                  onClick={handleUpvote}
                >
                  <span
                    className={`xai-post-action-icon xai-post-upvote ${
                      isAnimating ? "xai-post-pulse" : ""
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill={userVote === "upvote" ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                    </svg>
                  </span>
                  <span className="xai-post-action-count">{upVotes}</span>
                </button>
                <button
                  className={`xai-post-action-button ${
                    userVote === "downvote" ? "xai-post-active" : ""
                  }`}
                  onClick={handleDownvote}
                >
                  <span className="xai-post-action-icon xai-post-downvote">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill={userVote === "downvote" ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
                    </svg>
                  </span>
                  <span className="xai-post-action-count">{downVotes}</span>
                </button>
                <div className="xai-post-action-spacer"></div>
                <button
                  className={`xai-post-action-button ${
                    isBookmarked ? "xai-post-active" : ""
                  }`}
                  onClick={handleBookmark}
                >
                  <span className="xai-post-action-icon xai-post-bookmark">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill={isBookmarked ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="xai-post-comments-section">
            <div className="xai-post-comments-header">
              <h4 className="xai-post-comments-title">Comments</h4>
              <span className="xai-post-comments-count">{comments.length}</span>
            </div>

            <form className="xai-post-comment-form" onSubmit={addComment}>
              <div className="xai-post-comment-input-container">
                <input
                  type="text"
                  className="xai-post-comment-input"
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <div className="xai-post-input-glow"></div>
              </div>
              <button
                type="submit"
                className="xai-post-comment-submit"
                disabled={!commentText.trim()}
              >
                <span className="xai-post-submit-icon">
                  <Send size={20} />
                </span>
              </button>
            </form>

            {comments.length === 0 ? (
              <div className="xai-post-comments-empty">
                <p>No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              <div
                className={`xai-post-comments-list ${
                  showCommentAnimation ? "xai-post-new-comment-added" : ""
                }`}
              >
                {comments.map((comment, index) => (
                  <div
                    key={comment._id}
                    className={`xai-post-comment ${
                      index === 0 && showCommentAnimation
                        ? "xai-post-comment-new"
                        : ""
                    }`}
                  >
                    <div className="xai-post-comment-avatar-container">
                      {comment.userId?.avatar ? (
                        <img
                          src={comment.userId.avatar || "/placeholder.svg"}
                          alt={comment.userId.username}
                          className="xai-post-comment-avatar"
                        />
                      ) : (
                        <div className="xai-post-comment-avatar">
                          <span>
                            {comment.userId?.username?.charAt(0) || "U"}
                          </span>
                        </div>
                      )}
                      <div className="xai-post-comment-avatar-glow"></div>
                    </div>
                    <div className="xai-post-comment-content">
                      <div className="xai-post-comment-header">
                        <div className="xai-post-comment-author-container">
                          <h5 className="xai-post-comment-author">
                            {comment.userId?.username || "Anonymous"}
                          </h5>
                        </div>
                        <span className="xai-post-comment-timestamp">
                          {getTimeAgo(comment.createdAt)}
                        </span>
                      </div>
                      <p className="xai-post-comment-text">{comment.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostPage;
