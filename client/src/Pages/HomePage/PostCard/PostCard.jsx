import { useReducer, useEffect, useRef, useMemo, useCallback, useState } from "react";
import { useSelector } from "react-redux";
import { getTimeAgo } from "../Helpers";
import { ImageCarousel } from "../ImageCarousel";
import axios from "axios";
import { toast } from "react-toastify";
import "./PostCard.css";
import {
  User,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  History,
  Star,
  FileText,
  MessageSquare,
  Vote,
  Lightbulb,
  Bell,
  Info,
  PieChart,
  Bookmark,
  Share2,
  MoreHorizontal,
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_BACKEND_BASEURL;
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_BASEURL;

const initialState = {
  isAnimating: false,
  isBookmarked: false,
  comments: [],
  showComments: false,
  commentText: "",
  isLoadingComments: false,
  userVote: null,
  upVotes: 0,
  downVotes: 0,
  placeholderIndex: 0,
  selectedPollOption: null,
  syncAnimation: false,
  visualState: 0,
  showContactForm: false,
  contactMessage: "",
  showPollResults: false,
  pollResults: null,
  selectedOption: null,
  openEndedResponse: "",
  rating: 0,
  isSubmitting: false,
  isFocused: false,
  charCount: 0,
};

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_ANIMATING":
      return { ...state, isAnimating: action.payload };
    case "SET_BOOKMARK":
      return { ...state, isBookmarked: action.payload, syncAnimation: true };
    case "SET_COMMENTS":
      return { ...state, comments: action.payload };
    case "TOGGLE_COMMENTS":
      return { ...state, showComments: !state.showComments, syncAnimation: !state.showComments };
    case "SET_COMMENT_TEXT":
      return { ...state, commentText: action.payload };
    case "SET_LOADING_COMMENTS":
      return { ...state, isLoadingComments: action.payload };
    case "SET_VOTE":
      return {
        ...state,
        userVote: action.payload.userVote,
        upVotes: action.payload.upVotes,
        downVotes: action.payload.downVotes,
        isAnimating: action.payload.isAnimating || false,
        syncAnimation: action.payload.userVote !== null,
      };
    case "SET_PLACEHOLDER_INDEX":
      return { ...state, placeholderIndex: action.payload };
    case "SET_POLL_OPTION":
      return { ...state, selectedPollOption: action.payload, syncAnimation: true };
    case "SET_VISUAL_STATE":
      return { ...state, visualState: action.payload };
    case "TOGGLE_CONTACT_FORM":
      return { ...state, showContactForm: !state.showContactForm };
    case "SET_CONTACT_MESSAGE":
      return { ...state, contactMessage: action.payload };
    case "RESET_CONTACT_FORM":
      return { ...state, showContactForm: false, contactMessage: "", syncAnimation: true };
    case "SET_POLL_RESULTS":
      return { ...state, pollResults: action.payload, showPollResults: true };
    case "TOGGLE_POLL_RESULTS":
      return { ...state, showPollResults: !state.showPollResults };
    case "SET_SELECTED_OPTION":
      return { ...state, selectedOption: action.payload };
    case "SET_OPEN_ENDED_RESPONSE":
      return { ...state, openEndedResponse: action.payload, charCount: action.payload.length };
    case "SET_RATING":
      return { ...state, rating: action.payload };
    case "SET_IS_SUBMITTING":
      return { ...state, isSubmitting: action.payload };
    case "SET_IS_FOCUSED":
      return { ...state, isFocused: action.payload };
    default:
      return state;
  }
};

const apiCall = async ({ method, endpoint, data = {}, headers = {}, withCredentials = false }) => {
  try {
    const response = await axios({
      method,
      url: `${BASE_URL}${endpoint}`,
      data,
      headers: {
        Authorization: `Bearer ${data.token}`,
        "Content-Type": "application/json",
        ...headers,
      },
      withCredentials,
    });
    if (!response.data.success) {
      throw new Error(response.data.message || "Request failed");
    }
    return response.data;
  } catch (error) {
    toast.error(error.response?.data?.message || error.message);
    throw error;
  }
};

export const PostCard = ({ post, navigate }) => {
  const { token, userData } = useSelector((state) => state.user);
  const user = userData;

  const getInitialVoteState = useCallback(() => {
    const votedPosts = JSON.parse(localStorage.getItem("votedPosts") || "{}");
    
    // Prefer server-provided userVote if available
    let userVote = post.userVote !== undefined ? post.userVote : (votedPosts[post._id] || null);
    
    // Sync localStorage to match server (if server provided a value)
    if (post.userVote !== undefined) {
      if (userVote) {
        votedPosts[post._id] = userVote;
      } else {
        delete votedPosts[post._id];
      }
      localStorage.setItem("votedPosts", JSON.stringify(votedPosts));
    }
    
    return {
      ...initialState,
      isBookmarked: user?.bookmarks?.includes(post._id) || false,
      userVote: userVote,
      upVotes: post.upVotes || 0,
      downVotes: post.downVotes || 0,
    };
  }, [post._id, post.userVote, post.upVotes, post.downVotes, user?.bookmarks]);

  const [state, dispatch] = useReducer(reducer, {}, getInitialVoteState);
  const cardRef = useRef(null);

  const placeholders = useMemo(() => [
    "Share your thoughts...",
    "Add a comment...",
    "Join the discussion...",
    "Post your message...",
  ], []);

  const filteredImages = useMemo(() => {
    if (!post || !post.attachments) return [];
    return post.attachments.filter((attachment) => attachment.fileType?.startsWith("image/")) || [];
  }, [post]);

  const isPoll = useMemo(() => post.type === "poll", [post.type]);
  const item = useMemo(() => isPoll ? post.poll : post.survey, [isPoll, post.poll, post.survey]);
  const question = useMemo(() => isPoll ? item?.question : item?.questions[0]?.question || "", [isPoll, item]);
  const questionType = useMemo(() => isPoll ? "multiple-choice" : item?.questions[0]?.type || "", [isPoll, item]);
  const now = useMemo(() => new Date(), []);
  const deadlineDate = useMemo(() => item?.deadline ? new Date(item.deadline) : null, [item?.deadline]);
  const status = useMemo(() => {
    return item?.status
      ? item.status
      : post.type === "survey" && deadlineDate
        ? deadlineDate > now
          ? "upcoming"
          : deadlineDate < now
          ? "past"
          : "active"
        : post.type === "survey"
        ? "upcoming" // Default to "upcoming" for surveys without status or deadline
        : "unknown";
  }, [item?.status, post.type, deadlineDate, now]);
  const deadline = useMemo(() => item?.deadline ? new Date(item.deadline) : null, [item?.deadline]);

  const options = useMemo(
    () =>
      isPoll
        ? post.poll?.options || []
        : post.survey?.questions[0]?.options?.map((opt, index) => ({
            _id: opt._id || index,
            text: opt,
          })) || [],
    [isPoll, post.poll?.options, post.survey?.questions],
  );

  const hasImages = useMemo(() => filteredImages.length > 0, [filteredImages.length]);

  const hasParticipated = useMemo(() => {
    if (!user?._id) return false;
    if (isPoll) {
      return post.poll?.options?.some((opt) => opt.votedBy?.some((vote) => vote.userId === user._id));
    }
    return post.survey?.questions?.some((q) => q.responses?.some((r) => r.userId === user._id));
  }, [isPoll, post.poll?.options, post.survey?.questions, user?._id]);

  useEffect(() => {
    let interval;
    if (state.showComments) {
      interval = setInterval(() => {
        dispatch({
          type: "SET_PLACEHOLDER_INDEX",
          payload: (state.placeholderIndex + 1) % placeholders.length,
        });
      }, 3000);
    }
    return () => interval && clearInterval(interval);
  }, [state.showComments, state.placeholderIndex, placeholders.length]);

  const toggleBookmark = useCallback(async (e) => {
    e.stopPropagation();

    if (!token) {
      toast.error("Authentication required to save");
      return;
    }

    try {
      const endpoint = state.isBookmarked ? "/user/bookmark-del" : "/user/bookmark";
      await apiCall({
        method: state.isBookmarked ? "DELETE" : "POST",
        endpoint,
        data: { postId: post._id, token },
      });
      dispatch({ type: "SET_BOOKMARK", payload: !state.isBookmarked });
      toast.success(state.isBookmarked ? "Bookmark removed" : "Bookmark added");
    } catch (error) {
      // Error handled in apiCall
    }
  }, [state.isBookmarked, post._id, token]);

  const handleShareClick = useCallback((id) => async (e) => {
    e.stopPropagation();

    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title || "Check out this post",
          url: `${FRONTEND_URL}/post/${id}`,
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      try {
        const postUrl = `${FRONTEND_URL}/post/${id}`;
        await navigator.clipboard.writeText(postUrl);
        toast.success("Link copied to clipboard!");
      } catch (err) {
        console.error("Copy failed: ", err);
        toast.error("Copy failed");
      }
    }
  }, [post?.title]);

    const handleUpvote = useCallback(async (e) => {
      e.stopPropagation();

      if (!token) {
        toast.error("Authentication required to vote");
        return;
      }

      // Optimistic update - update UI immediately
      const currentUserVote = state.userVote;
      const currentUpVotes = state.upVotes;
      const currentDownVotes = state.downVotes;

      let newVote;
      let newUpVotes;
      let newDownVotes;

      if (currentUserVote === "upvote") {
        // Removing upvote
        newVote = null;
        newUpVotes = Math.max(0, currentUpVotes - 1);
        newDownVotes = currentDownVotes;
      } else if (currentUserVote === "downvote") {
        // Switching from downvote to upvote
        newVote = "upvote";
        newUpVotes = currentUpVotes + 1;
        newDownVotes = Math.max(0, currentDownVotes - 1);
      } else {
        // New upvote
        newVote = "upvote";
        newUpVotes = currentUpVotes + 1;
        newDownVotes = currentDownVotes;
      }

      // Immediate UI update
      dispatch({
        type: "SET_VOTE",
        payload: {
          userVote: newVote,
          upVotes: newUpVotes,
          downVotes: newDownVotes,
          isAnimating: newVote === "upvote",
        },
      });

      // Update localStorage immediately
      const votedPosts = JSON.parse(localStorage.getItem("votedPosts") || "{}");
      if (newVote) {
        votedPosts[post._id] = newVote;
      } else {
        delete votedPosts[post._id];
      }
      localStorage.setItem("votedPosts", JSON.stringify(votedPosts));

      // Play sound immediately
      if (newVote === "upvote") {
        setTimeout(() => dispatch({ type: "SET_ANIMATING", payload: false }), 1000);
        const soundEnabled = localStorage.getItem("soundEnabled") === "true";
        if (soundEnabled) {
          const upvoteSound = new Audio("/upvote-sound.mp3");
          upvoteSound.volume = 0.3;
          upvoteSound.play().catch((e) => console.log("Audio failed:", e));
        }
      }

      // API call in background
      try {
        const endpoint = currentUserVote === "upvote" ? `/post/remove/${post._id}` : `/post/up/${post._id}`;
        await apiCall({
          method: "POST",
          endpoint,
          data: { token },
        });
        
        // If the API call succeeds, we're already in the correct state
        // If it fails, we could revert the optimistic update, but usually we keep it for better UX
        
      } catch (error) {
        console.error('Upvote error:', error.response?.data || error.message);
        // Optional: Revert optimistic update on error
        // dispatch({
        //   type: "SET_VOTE",
        //   payload: {
        //     userVote: currentUserVote,
        //     upVotes: currentUpVotes,
        //     downVotes: currentDownVotes,
        //   },
        // });
        // toast.error("Failed to update vote");
      }
    }, [post._id, token, state.userVote, state.upVotes, state.downVotes]);

    const handleDownvote = useCallback(async (e) => {
      e.stopPropagation();

      if (!token) {
        toast.error("Authentication required to vote");
        return;
      }

      // Optimistic update - update UI immediately
      const currentUserVote = state.userVote;
      const currentUpVotes = state.upVotes;
      const currentDownVotes = state.downVotes;

      let newVote;
      let newUpVotes;
      let newDownVotes;

      if (currentUserVote === "downvote") {
        // Removing downvote
        newVote = null;
        newUpVotes = currentUpVotes;
        newDownVotes = Math.max(0, currentDownVotes - 1);
      } else if (currentUserVote === "upvote") {
        // Switching from upvote to downvote
        newVote = "downvote";
        newUpVotes = Math.max(0, currentUpVotes - 1);
        newDownVotes = currentDownVotes + 1;
      } else {
        // New downvote
        newVote = "downvote";
        newUpVotes = currentUpVotes;
        newDownVotes = currentDownVotes + 1;
      }

      // Immediate UI update
      dispatch({
        type: "SET_VOTE",
        payload: {
          userVote: newVote,
          upVotes: newUpVotes,
          downVotes: newDownVotes,
        },
      });

      // Update localStorage immediately
      const votedPosts = JSON.parse(localStorage.getItem("votedPosts") || "{}");
      if (newVote) {
        votedPosts[post._id] = newVote;
      } else {
        delete votedPosts[post._id];
      }
      localStorage.setItem("votedPosts", JSON.stringify(votedPosts));

      // Play sound immediately
      if (newVote === "downvote") {
        const soundEnabled = localStorage.getItem("soundEnabled") === "true";
        if (soundEnabled) {
          const downvoteSound = new Audio("/downvote-sound.mp3");
          downvoteSound.volume = 0.3;
          downvoteSound.play().catch((e) => console.log("Audio failed:", e));
        }
      }

      // API call in background
      try {
        const endpoint = currentUserVote === "downvote" ? `/post/remove/${post._id}` : `/post/down/${post._id}`;
        await apiCall({
          method: "POST",
          endpoint,
          data: { token },
        });
        
        // If the API call succeeds, we're already in the correct state
        
      } catch (error) {
        console.error('Downvote error:', error.response?.data || error.message);
        // Optional: Revert optimistic update on error
        // dispatch({
        //   type: "SET_VOTE",
        //   payload: {
        //     userVote: currentUserVote,
        //     upVotes: currentUpVotes,
        //     downVotes: currentDownVotes,
        //   },
        // });
        // toast.error("Failed to update vote");
      }
    }, [post._id, token, state.userVote, state.upVotes, state.downVotes]);

  const fetchComments = useCallback(async () => {
    if (!state.showComments) {
      dispatch({ type: "SET_LOADING_COMMENTS", payload: true });
      try {
        const response = await apiCall({
          method: "GET",
          endpoint: `/post/${post._id}/comments`,
          data: { token },
        });
        dispatch({ type: "SET_COMMENTS", payload: response.comments });
      } catch (error) {
        console.error("Failed to fetch comments:", error);
      } finally {
        dispatch({ type: "SET_LOADING_COMMENTS", payload: false });
      }
    }
    dispatch({ type: "TOGGLE_COMMENTS" });

    if (!state.showComments) {
      const soundEnabled = localStorage.getItem("soundEnabled") === "true";
      if (soundEnabled) {
        const commentSound = new Audio("/comment-sound.mp3");
        commentSound.volume = 0.3;
        commentSound.play().catch((e) => console.log("Audio failed:", e));
      }
    }
  }, [post._id, state.showComments, token]);

  const addComment = useCallback(async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("Authentication required to comment");
      return;
    }

    if (!state.commentText.trim()) {
      return;
    }

    try {
      await apiCall({
        method: "POST",
        endpoint: "/post/comment",
        data: { postId: post._id, message: state.commentText, token },
      });
      dispatch({ type: "SET_COMMENT_TEXT", payload: "" });
      toast.success("Comment posted successfully");
      const commentsResponse = await apiCall({
        method: "GET",
        endpoint: `/post/${post._id}/comments`,
        data: { token },
      });
      dispatch({ type: "SET_COMMENTS", payload: commentsResponse.comments });
    } catch (error) {
      console.error("Failed to post comment:", error);
    }
  }, [state.commentText, post._id, token]);

  const handleOptionChange = useCallback((index) => {
    dispatch({ type: "SET_SELECTED_OPTION", payload: index });
  }, []);

  const handleRatingChange = useCallback((newRating) => {
    dispatch({ type: "SET_RATING", payload: newRating });
  }, []);

  const handleTextareaChange = useCallback((e) => {
    dispatch({ type: "SET_OPEN_ENDED_RESPONSE", payload: e.target.value });
  }, []);

  const handleVote = useCallback(
    async (e) => {
      e.stopPropagation();
      if (state.selectedOption !== null || state.openEndedResponse || state.rating > 0) {
        dispatch({ type: "SET_IS_SUBMITTING", payload: true });
        const voteData = {
          option: null,
          response: null,
          rating: null,
          userId: user?._id,
        };

        if (isPoll) {
          voteData.option = options[state.selectedOption]?._id;
        } else if (post.type === "survey") {
          if (questionType === "multiple-choice") {
            voteData.option = options[state.selectedOption]?._id;
          } else if (questionType === "open-ended") {
            voteData.response = state.openEndedResponse;
          } else if (questionType === "rating") {
            voteData.rating = state.rating;
          }
        }

        try {
          const response = await fetch(`${BASE_URL}/post/${post._id}/vote`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
            body: JSON.stringify(voteData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to submit vote");
          }

          dispatch({ type: "SET_POLL_OPTION", payload: state.selectedOption });
          dispatch({ type: "SET_OPEN_ENDED_RESPONSE", payload: "" });
          dispatch({ type: "SET_RATING", payload: 0 });
          toast.success("Your vote has been submitted successfully!");

          // Refresh post data
          const postResponse = await apiCall({
            method: "GET",
            endpoint: `/post/${post._id}`,
            data: { token },
          });
          if (postResponse.success) {
            window.location.reload();
          }
        } catch (error) {
          toast.error(error.message || "An error occurred while submitting your vote.");
        } finally {
          dispatch({ type: "SET_IS_SUBMITTING", payload: false });
        }
      }
    },
    [
      state.selectedOption,
      state.openEndedResponse,
      state.rating,
      user?._id,
      isPoll,
      options,
      post._id,
      post.type,
      questionType,
      token,
    ],
  );

  const handleViewResults = useCallback(
    async (e) => {
      e.stopPropagation();
      if (!state.showPollResults) {
        try {
          const response = await fetch(`${BASE_URL}/post/${post._id}/results`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
            credentials: "include",
          });
          if (!response.ok) throw new Error("Failed to fetch results");
          const data = await response.json();
          dispatch({ type: "SET_POLL_RESULTS", payload: data.results || null });
        } catch (error) {
          toast.error(error.message || "An error occurred while fetching results.");
        }
      }
      dispatch({ type: "TOGGLE_POLL_RESULTS" });
    },
    [post._id, token, state.showPollResults],
  );

  const getStatusIcon = useCallback((status) => {
    switch (status) {
      case "active":
        return <CheckCircle className="status-icon" />;
      case "upcoming":
        return <Clock className="status-icon" />;
      case "past":
        return <History className="status-icon" />;
      default:
        return null;
    }
  }, []);

  const getStatusClass = useCallback((status) => {
    switch (status) {
      case "active":
        return "status-active";
      case "upcoming":
        return "status-upcoming";
      case "past":
        return "status-past";
      default:
        return "status-default";
    }
  }, []);

  const getDeadlineText = useCallback(() => {
    if (!deadline) return "";
    const formattedDate = deadline.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    switch (status) {
      case "active":
        return `Ends on ${formattedDate}`;
      case "upcoming":
        return `Starts on ${formattedDate}`;
      case "past":
        return `Ended on ${formattedDate}`;
      default:
        return formattedDate;
    }
  }, [deadline, status]);

  const renderOptions = useMemo(() => {
    if (status !== "active") return null;

    if (questionType === "multiple-choice") {
      return options.map((option, index) => (
        <div
          key={isPoll ? option._id : index}
          className={`survey-card-option ${state.selectedOption === index ? "selected" : ""}`}
          onClick={() => handleOptionChange(index)}
        >
          <div className="survey-card-radio-container">
            <input
              type="radio"
              id={`option-${post._id}-${isPoll ? option._id : index}`}
              name={`survey-${post._id}`}
              value={isPoll ? option.text : option.text}
              checked={state.selectedOption === index}
              onChange={() => handleOptionChange(index)}
              className="survey-card-radio"
            />
            <span className="survey-card-radio-checkmark"></span>
          </div>
          <label htmlFor={`option-${post._id}-${isPoll ? option._id : index}`} className="survey-card-option-label">
            {isPoll ? option.text : option.text}
          </label>
        </div>
      ));
    } else if (questionType === "open-ended") {
      return (
        <div className={`survey-card-open-ended ${state.isFocused ? "focused" : ""}`}>
          <div className="textarea-container">
            <MessageSquare className="textarea-icon" />
            <textarea
              className="survey-card-textarea"
              placeholder="Type your response here..."
              value={state.openEndedResponse}
              onChange={handleTextareaChange}
              onFocus={() => dispatch({ type: "SET_IS_FOCUSED", payload: true })}
              onBlur={() => dispatch({ type: "SET_IS_FOCUSED", payload: false })}
            />
            <div className="textarea-border"></div>
          </div>
          <div className="textarea-footer">
            <div className="char-count">
              <span className={state.charCount > 0 ? "has-text" : ""}>{state.charCount}</span> characters
            </div>
            <div className="textarea-hint">
              <Info className="hint-icon" />
              <span>Be concise and specific in your response</span>
            </div>
          </div>
        </div>
      );
    } else if (questionType === "rating") {
      return (
        <div className="survey-card-rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`survey-card-star ${star <= state.rating ? "filled" : ""}`}
              onClick={() => handleRatingChange(star)}
            >
              <Star className={`star-icon ${star <= state.rating ? "filled" : ""}`} />
            </span>
          ))}
          <div className="rating-label">
            {state.rating === 0 && "Select a rating"}
            {state.rating === 1 && "Poor"}
            {state.rating === 2 && "Fair"}
            {state.rating === 3 && "Good"}
            {state.rating === 4 && "Very Good"}
            {state.rating === 5 && "Excellent"}
          </div>
        </div>
      );
    }
    return null;
  }, [
    status,
    questionType,
    options,
    isPoll,
    post._id,
    state.selectedOption,
    state.isFocused,
    state.openEndedResponse,
    state.charCount,
    state.rating,
    handleOptionChange,
    handleTextareaChange,
    handleRatingChange,
  ]);

  const renderResults = useMemo(() => {
    if (status !== "past" || !state.pollResults || !state.showPollResults) return null;

    if (post.type === "poll") {
      return (
        <div className="survey-card-results-container">
          <h4 className="results-title">Poll Results</h4>
          <div className="survey-card-results">
            {state.pollResults.poll.options.map((option, index) => {
              const colorClasses = ["blue", "purple", "green", "orange", "red"];
              const colorClass = colorClasses[index % colorClasses.length];
              const percentage =
                state.pollResults.poll.totalVotes > 0
                  ? Math.round((option.votes / state.pollResults.poll.totalVotes) * 100)
                  : 0;
              return (
                <div key={index} className="survey-card-result">
                  <div className="survey-card-result-header">
                    <span className="survey-card-result-label">{option.text}</span>
                    <span className={`survey-card-result-percentage ${colorClass}`}>{percentage}%</span>
                  </div>
                  <div className="survey-card-result-bar">
                    <div
                      className={`survey-card-result-progress ${colorClass}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="survey-card-result-votes">
                    <Vote className="votes-icon" />
                    <span>
                      {option.votes} {option.votes === 1 ? "vote" : "votes"}
                    </span>
                  </div>
                </div>
              );
            })}
            <div className="survey-card-total-votes">
              <PieChart className="total-votes-icon" />
              <span>Total Votes: {state.pollResults.poll.totalVotes}</span>
            </div>
          </div>
        </div>
      );
    } else if (post.type === "survey") {
      return (
        <div className="survey-card-results-container">
          <h4 className="results-title">Survey Results</h4>
          <div className="survey-card-results">
            {state.pollResults.survey.questions.map((question, qIndex) => (
              <div key={qIndex} className="survey-question-results">
                <h5 className="question-title">{question.question}</h5>
                {question.type === "multiple-choice" ? (
                  <>
                    {question.options.map((option, oIndex) => {
                      const colorClasses = ["blue", "purple", "green", "orange", "red"];
                      const colorClass = colorClasses[oIndex % colorClasses.length];
                      const percentage =
                        question.totalVotes > 0 ? Math.round((option.votes / question.totalVotes) * 100) : 0;
                      return (
                        <div key={oIndex} className="survey-card-result">
                          <div className="survey-card-result-header">
                            <span className="survey-card-result-label">{option.text}</span>
                            <span className={`survey-card-result-percentage ${colorClass}`}>{percentage}%</span>
                          </div>
                          <div className="survey-card-result-bar">
                            <div
                              className={`survey-card-result-progress ${colorClass}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <div className="survey-card-result-votes">
                            <Vote className="votes-icon" />
                            <span>
                              {option.votes} {option.votes === 1 ? "vote" : "votes"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div className="survey-card-total-votes">
                      <PieChart className="total-votes-icon" />
                      <span>Total Votes: {question.totalVotes}</span>
                    </div>
                  </>
                ) : question.type === "open-ended" ? (
                  <div className="open-ended-responses">
                    {question.responses.map((response, rIndex) => (
                      <div key={rIndex} className="response-item">
                        <div className="response-content">
                          <span className="response-text">{response.response}</span>
                        </div>
                        <div className="response-user-info">
                          <div className="response-user-avatar">{response.username?.charAt(0) || "U"}</div>
                          <span className="response-username">{response.username}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : question.type === "rating" ? (
                  <div className="rating-results">
                    {question.ratings.map((rating, rIndex) => (
                      <div key={rIndex} className="rating-item">
                        <div className="rating-stars">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className={`rating-star ${star <= rating.rating ? "filled" : ""}`} />
                          ))}
                        </div>
                        <div className="rating-user-info">
                          <div className="rating-user-avatar">{rating.username?.charAt(0) || "U"}</div>
                          <span className="rating-username">{rating.username}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  }, [status, state.pollResults, post.type, state.showPollResults]);

  const renderPostHeader = useCallback(() => {
    return (
      <div className="post-header">
        <div className="avatar-container">
          {post.createdBy?.avatar ? (
            <img 
              src={post.createdBy.avatar || "/placeholder.svg"} 
              alt={post.createdBy.username || "Anonymous user"} 
              className="avatar"
              loading="lazy"
              width="40"
              height="40" 
            />
          ) : (
            <div className="avatar">
              <span>{post.createdBy?.username?.charAt(0) || "U"}</span>
            </div>
          )}
        </div>
        <div className="author-info">
          <div className="author-name-container">
            <h3 className="author-name">{post.createdBy?.username || "Anonymous"}</h3>
            <span className={`post-type post-type-${post.type}`}>
              <span className="post-type-text">{post.type}</span>
            </span>
            <div className="verification-badge" title="Verified">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 22 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M8 12L10.5 14.5L16 9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <div className="post-meta">
            <span className="timestamp">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="meta-icon" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {getTimeAgo(post.createdAt)}
            </span>
          </div>
        </div>
      </div>
    );
  }, [post.createdBy, post.type, post.createdAt]);

  const renderPostActions = useCallback(() => {
    return (
      <div className="post-actions">
        <div className="action-buttons">
          <button
            className={`action-button ${state.userVote === "upvote" ? "active" : ""}`}
            id={`upvote-${post._id}`}
            onClick={handleUpvote}
            aria-label={`Upvote post, current votes: ${state.upVotes}`}
            aria-pressed={state.userVote === "upvote"}
          >
            <span className="action-icon upvote">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill={state.userVote === "upvote" ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
              </svg>
            </span>
            <div className="action-data">
              <span className="action-count">{state.upVotes}</span>
            </div>
          </button>
          <button
            className={`action-button ${state.userVote === "downvote" ? "active" : ""}`}
            id={`downvote-${post._id}`}
            onClick={handleDownvote}
            aria-label={`Downvote post, current votes: ${state.downVotes}`}
            aria-pressed={state.userVote === "downvote"}
          >
            <span className="action-icon downvote">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill={state.userVote === "downvote" ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
              </svg>
            </span>
            <div className="action-data">
              <span className="action-count">{state.downVotes}</span>
            </div>
          </button>
          <button
            className={`action-button ${state.showComments ? "active" : ""}`}
            id={`comment-${post._id}`}
            onClick={(e) => {
              e.stopPropagation();
              fetchComments();
            }}
            aria-label={`Toggle comments, current count: ${post.commentCount || state.comments.length || 0}`}
            aria-expanded={state.showComments}
          >
            <span className="action-icon comment">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </span>

          </button>
          <button
            className={`action-button ${state.isBookmarked ? "active" : ""}`}
            id={`bookmark-${post._id}`}
            onClick={toggleBookmark}
            aria-label={state.isBookmarked ? "Remove bookmark" : "Add bookmark"}
            aria-pressed={state.isBookmarked}
          >
            <span className="action-icon bookmark">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill={state.isBookmarked ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </span>
            <div className="action-data"></div>
          </button>
          <div className="action-spacer"></div>
          <button
            className="action-button"
            id={`share-${post._id}`}
            onClick={handleShareClick(post._id)}
            aria-label="Share post"
          >
            <span className="action-icon share">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
            </span>
            <div className="action-data"></div>
          </button>
        </div>
      </div>
    );
  }, [
    state.userVote,
    state.upVotes,
    state.downVotes,
    state.showComments,
    state.isBookmarked,
    post._id,
    post.commentCount,
    state.comments.length,
    handleUpvote,
    handleDownvote,
    fetchComments,
    toggleBookmark,
    handleShareClick,
  ]);

  const renderAttachments = useCallback(() => {
    if (filteredImages.length > 0) {
      return (
        <div className="post-images">
          <ImageCarousel images={filteredImages} />
        </div>
      );
    }
    return null;
  }, [filteredImages]);

  const renderIssuePost = useCallback(() => {
    return (
      <div className="post-content">
        {renderPostHeader()}
        <div className="issue-container">
          <div className="issue-status">
            <span className="issue-badge">Issue</span>
            <span className="issue-priority">High Priority</span>
          </div>
          <h4 className="post-title">{post.title}</h4>
          <p className="post-text">{post.description}</p>
          {renderAttachments()}
          <div className="issue-details">
            <div className="issue-detail">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="issue-icon"
                aria-hidden="true"
              >
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                <path d="M12 6v6l4 2"></path>
              </svg>
              <span>Status: Open</span>
            </div>
            <div className="issue-detail">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="issue-icon"
                aria-hidden="true"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>Assigned to: Community</span>
            </div>
          </div>
        </div>
        {renderPostActions()}
      </div>
    );
  }, [post.title, post.description, renderPostHeader, renderAttachments, renderPostActions]);

  const renderPollOrSurveyPost = useCallback(() => {
    return (
      <div className="post-content">
        {renderPostHeader()}
        <div
          className={`survey-card ${state.showPollResults ? "hovered" : ""} ${
            status === "active" || status === "upcoming" ? "compact" : ""
          }`}
          role="region"
          aria-label={`${post.type} card`}
        >
          <div className="survey-card-header">
            <div className="survey-card-title-container">
              <h3 className="survey-card-title">{post.title}</h3>
              <div className="survey-card-description-container">
                <FileText className="description-icon" />
                <p className="survey-card-description">{post.description}</p>
              </div>
              <div className="survey-card-meta">
                <span className="survey-card-type">
                  <BarChart3 className="meta-icon" /> {post.type}
                </span>
              </div>
            </div>
            <span className={`survey-card-badge ${getStatusClass(status)}`}>
              {getStatusIcon(status)}
              <span className="status-text">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
            </span>
          </div>

          {deadline && (
            <div className="survey-card-deadline">
              <Calendar className="deadline-icon" />
              {getDeadlineText()}
            </div>
          )}

          {hasImages && (
            <div className="survey-card-images">
              <ImageCarousel images={filteredImages} />
            </div>
          )}

          <div className="survey-card-content">
            <div className="survey-card-question-container">
              <Lightbulb className="question-icon" />
              <p className="survey-card-question">{question}</p>
            </div>

            {renderResults}

            {status === "upcoming" && (
              <div className="survey-card-upcoming">
                <Clock className="upcoming-icon" />
                <div className="upcoming-content">
                  <p>This {isPoll ? "poll" : "survey"} is not yet active.</p>
                  <p>You can set a reminder to be notified when it starts.</p>
                </div>
              </div>
            )}

            {status === "active" && <div className="survey-card-options">{renderOptions}</div>}
          </div>

          <div className="survey-card-footer">


            {status === "active" ? (
              <button
                className={`survey-card-button submit-button ${
                  (state.selectedOption === null && !state.openEndedResponse && state.rating === 0) ||
                  hasParticipated ||
                  state.isSubmitting
                    ? "disabled"
                    : ""
                } ${state.isSubmitting ? "submitting" : ""}`}
                disabled={
                  (state.selectedOption === null && !state.openEndedResponse && state.rating === 0) ||
                  hasParticipated ||
                  state.isSubmitting
                }
                onClick={handleVote}
              >
                {state.isSubmitting ? (
                  <>
                    <span className="button-spinner"></span>
                    Submitting...
                  </>
                ) : hasParticipated ? (
                  <>
                    <CheckCircle className="button-icon" />
                    Already Participated
                  </>
                ) : (
                  <>
                    <Vote className="button-icon" />
                    Submit Response
                  </>
                )}
              </button>
            ) : status === "upcoming" ? (
              <></>
            ) : (
              <button className="survey-card-button results-button" onClick={handleViewResults}>
                <BarChart3 className="button-icon" />
                {state.showPollResults ? "Hide Results" : "View Full Results"}
              </button>
            )}
          </div>
        </div>
        {renderPostActions()}
      </div>
    );
  }, [
    renderPostHeader,
    post.title,
    post.description,
    post.type,
    post.createdBy?.username,
    state.showPollResults,
    state.isBookmarked,
    state.selectedOption,
    state.openEndedResponse,
    state.rating,
    state.isSubmitting,
    status,
    deadline,
    hasImages,
    filteredImages,
    question,
    renderResults,
    isPoll,
    renderOptions,
    toggleBookmark,
    handleShareClick,
    post._id,
    getStatusClass,
    getStatusIcon,
    status,
    getDeadlineText,
    hasParticipated,
    handleVote,
    handleViewResults,
    renderPostActions,
  ]);

  const renderMarketplacePost = useCallback(() => {
    const handleContactSeller = (e) => {
      e.stopPropagation();
      dispatch({ type: "TOGGLE_CONTACT_FORM" });
    };

    const handleSendMessage = async (e) => {
      e.stopPropagation();

      if (!token) {
        toast.error("Authentication required to send message");
        return;
      }

      if (!state.contactMessage.trim()) {
        toast.error("Please enter a message");
        return;
      }

      try {
        await apiCall({
          method: "POST",
          endpoint: `/post/marketplacePosts/${post._id}/message`,
          data: { message: state.contactMessage, token },
          withCredentials: true,
        });
        toast.success("Completed");
        dispatch({ type: "RESET_CONTACT_FORM" });
      } catch (error) {
        // Error handled in apiCall
      }
    };

    return (
      <div className="post-content">
        {renderPostHeader()}
        <h4 className="post-title">{post.title}</h4>

        {renderAttachments()}

        <div className="marketplace-details">
          {post.marketplace && (
            <>
              <div className="marketplace-price">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="price-icon"
                  aria-hidden="true"
                >
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                <span className="price-value">${post.marketplace.price}</span>
                <span className="marketplace-badge">{post.marketplace.itemType || "Sale"}</span>
                {post.marketplace.condition && (
                  <span className="marketplace-condition">{post.marketplace.condition}</span>
                )}
              </div>

              <p className="post-text">{post.description}</p>

              {post.marketplace.location && (
                <div className="marketplace-location">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="location-icon"
                    aria-hidden="true"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>{post.marketplace.location}</span>
                </div>
              )}

              {post.marketplace.tags && post.marketplace.tags.length > 0 && (
                <div className="marketplace-tags">
                  {post.marketplace.tags.map((tag, index) => (
                    <span key={`tag-${index}`} className="marketplace-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <button className="marketplace-contact-button" onClick={handleContactSeller} aria-label="Contact seller">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="contact-icon"
                  aria-hidden="true"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                Contact Seller
              </button>

              {state.showContactForm && (
                <div className="marketplace-contact-form" onClick={(e) => e.stopPropagation()}>
                  <textarea
                    className="marketplace-message"
                    placeholder="Compose message..."
                    value={state.contactMessage}
                    onChange={(e) => dispatch({ type: "SET_CONTACT_MESSAGE", payload: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    rows={4}
                    aria-label="Message to seller"
                  ></textarea>
                  <div className="marketplace-form-actions">
                    <button className="marketplace-cancel-button" onClick={handleContactSeller} aria-label="Cancel message">
                      Cancel
                    </button>
                    <button className="marketplace-send-button" onClick={handleSendMessage} aria-label="Send message">
                      <span className="send-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                          <path
                            d="M22 2L11 13"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M22 2L15 22L11 13L2 9L22 2Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      Send
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        {renderPostActions()}
      </div>
    );
  }, [post, state.showContactForm, state.contactMessage, token, renderPostHeader, renderAttachments, renderPostActions]);

  const renderAnnouncementPost = useCallback(() => {
    return (
      <div className="post-content">
        {renderPostHeader()}
        <div className="announcement-container">
          <div className="announcement-header">
            <h4 className="post-title">{post.title}</h4>
            {post.important && (
              <span className="announcement-badge">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="announcement-icon"
                  aria-hidden="true"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                Important
              </span>
            )}
          </div>

          <p className="post-text">{post.description}</p>
          {renderAttachments()}

          {post.event && (
            <div className="announcement-event">
              <div className="event-date-badge">
                <div className="event-date-month">
                  {new Date(post.event.date).toLocaleString("default", {
                    month: "short",
                  })}
                </div>
                <div className="event-date-day">{new Date(post.event.date).getDate()}</div>
              </div>
              <div className="event-info">
                <div className="event-info-item">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="event-icon"
                    aria-hidden="true"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span>{post.event.formattedDate}</span>
                </div>
                {post.event.time && (
                  <div className="event-info-item">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="event-icon"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span>{post.event.time}</span>
                  </div>
                )}
                {post.event.location && (
                  <div className="event-info-item">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="event-icon"
                      aria-hidden="true"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span>{post.event.location}</span>
                  </div>
                )}
                <div className="event-rsvp">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="event-icon"
                    aria-hidden="true"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <span>{post.event.rsvpCount || 0} people attending</span>
                </div>
              </div>
              <div className="event-rsvp-actions">
                <button className="event-rsvp-button event-rsvp-yes" aria-label="RSVP as going">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="rsvp-icon"
                    aria-hidden="true"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  Going
                </button>
                <button className="event-rsvp-button event-rsvp-maybe" aria-label="RSVP as maybe">Maybe</button>
                <button className="event-rsvp-button event-rsvp-no" aria-label="RSVP as not going">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="rsvp-icon"
                    aria-hidden="true"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  Not Going
                </button>
              </div>
            </div>
          )}
        </div>
        {renderPostActions()}
      </div>
    );
  }, [post, renderPostHeader, renderAttachments, renderPostActions]);

  const renderGeneralPost = useCallback(() => {
    return (
      <div className="post-content">
        {renderPostHeader()}
        <h4 className="post-title">{post.title}</h4>
        <p className="post-text">{post.description}</p>
        {renderAttachments()}
        {renderPostActions()}
      </div>
    );
  }, [post.title, post.description, renderPostHeader, renderAttachments, renderPostActions]);

  const renderCommentSection = useCallback(() => {
    if (!state.showComments) return null;

    return (
      <div className="comments-section" onClick={(e) => e.stopPropagation()}>
        <div className="comments-header">
          <h4 className="comments-title">Comments</h4>
          <span className="comments-count">{state.comments.length}</span>
        </div>

        <form className="comment-form" onSubmit={addComment}>
          <div className="comment-input-container">
            <input
              type="text"
              className="comment-input"
              placeholder={placeholders[state.placeholderIndex]}
              value={state.commentText}
              onChange={(e) => dispatch({ type: "SET_COMMENT_TEXT", payload: e.target.value })}
              aria-label="Add a comment"
            />
          </div>
          <button type="submit" className="comment-submit" disabled={!state.commentText.trim()} aria-label="Submit comment">
            <span className="submit-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </span>
          </button>
        </form>

        {state.isLoadingComments ? (
          <div className="comments-loading">
            <p>Loading comments...</p>
          </div>
        ) : state.comments.length === 0 ? (
          <div className="comments-empty">
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <div className="comments-list">
            {state.comments.map((comment) => (
              <div key={comment._id} className="comment">
                <div className="comment-avatar-container">
                  {comment.userId?.avatar ? (
                    <img
                      src={comment.userId.avatar || "/placeholder.svg"}
                      alt={comment.userId.username || "Anonymous user"}
                      className="comment-avatar"
                      loading="lazy"
                      width="32"
                      height="32"
                    />
                  ) : (
                    <div className="comment-avatar">
                      <span>{comment.userId?.username?.charAt(0) || "U"}</span>
                    </div>
                  )}
                </div>
                <div className="comment-content">
                  <div className="comment-header">
                    <div className="comment-author-container">
                      <h5 className="comment-author">{comment.userId?.username || "Anonymous"}</h5>
                    </div>
                    <span className="comment-timestamp">{getTimeAgo(comment.createdAt)}</span>
                  </div>
                  <p className="comment-text">{comment.message}</p>
                  <div className="comment-actions">
                    <button className="comment-action" aria-label="Like comment">
                      <span className="comment-action-icon upvote">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                        </svg>
                      </span>
                      <span>Like</span>
                    </button>
                    <button className="comment-action" aria-label="Reply to comment">
                      <span className="comment-action-icon reply">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <polyline points="9 17 4 12 9 7" />
                          <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                        </svg>
                      </span>
                      <span>Reply</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }, [state.showComments, state.comments, state.isLoadingComments, state.commentText, state.placeholderIndex, placeholders, addComment]);

  const renderPostContent = useCallback(() => {
    let content;
    switch (post.type) {
      case "issue":
        content = renderIssuePost();
        break;
      case "poll":
      case "survey":
        content = renderPollOrSurveyPost();
        break;
      case "marketplace":
        content = renderMarketplacePost();
        break;
      case "announcements":
        content = renderAnnouncementPost();
        break;
      default:
        content = renderGeneralPost();
    }

    return (
      <>
        {content}
        {renderCommentSection()}
      </>
    );
  }, [post.type, renderIssuePost, renderPollOrSurveyPost, renderMarketplacePost, renderAnnouncementPost, renderGeneralPost, renderCommentSection]);

  return (
    <div
      ref={cardRef}
      className="post-card"
      onClick={() => {
        navigate(`/post/${post._id}`);
      }}
      id={`post-${post._id}`}
      role="article"
      aria-label={`Post by ${post.createdBy?.username || "Anonymous"}`}
    >
      <div className="card-content">{renderPostContent()}</div>
    </div>
  );
};