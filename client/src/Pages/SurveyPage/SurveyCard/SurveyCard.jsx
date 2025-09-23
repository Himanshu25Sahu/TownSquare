"use client"

import { useState, useCallback, useMemo } from "react"
import { toast } from "react-toastify"
import { useSelector } from "react-redux"
import ImageCarousel from "./ImageCarousel.jsx"
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
} from "lucide-react"

const SurveyCard = ({ post, onVote, onViewResults }) => {
  const [selectedOption, setSelectedOption] = useState(null)
  const [openEndedResponse, setOpenEndedResponse] = useState("")
  const [rating, setRating] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [charCount, setCharCount] = useState(0)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [results, setResults] = useState(null)
  const [showResults, setShowResults] = useState(false)

  const { userData } = useSelector((state) => state.user)

  const isPoll = post.type === "poll"
  const item = isPoll ? post.poll : post.survey
  const status = item.status
  const deadline = new Date(item.deadline)
  const question = isPoll ? item.question : item.questions[0]?.question || ""

  const options = useMemo(
    () =>
      isPoll
        ? post.poll.options
        : post.survey.questions[0]?.options.map((opt, index) => ({
            _id: opt._id || index,
            text: opt,
          })),
    [isPoll, post],
  )

  const hasImages = post.attachments && post.attachments.length > 0
  const questionType = isPoll ? "multiple-choice" : item.questions[0]?.type || ""

  const getStatusIcon = useCallback((status) => {
    switch (status) {
      case "active":
        return <CheckCircle className="status-icon" />
      case "upcoming":
        return <Clock className="status-icon" />
      case "past":
        return <History className="status-icon" />
      default:
        return null
    }
  }, [])

  const getStatusClass = useCallback((status) => {
    switch (status) {
      case "active":
        return "status-active"
      case "upcoming":
        return "status-upcoming"
      case "past":
        return "status-past"
      default:
        return "status-default"
    }
  }, [])

  const getDeadlineText = useCallback(() => {
    const formattedDate = deadline.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    switch (status) {
      case "active":
        return `Ends on ${formattedDate}`
      case "upcoming":
        return `Starts on ${formattedDate}`
      case "past":
        return `Ended on ${formattedDate}`
      default:
        return formattedDate
    }
  }, [deadline, status])

  const hasParticipated = useMemo(() => {
    if (!userData?._id) return false
    if (isPoll) {
      return post.poll.options?.some((opt) => opt.voters?.includes(userData._id))
    }
    return post.survey.questions?.some((q) => q.responses?.some((r) => r.userId === userData._id))
  }, [isPoll, post, userData?._id])

  const handleSubmit = useCallback(async () => {
    if (selectedOption !== null || openEndedResponse || rating > 0) {
      setIsSubmitting(true)
      const voteData = {
        option: null,
        response: null,
        rating: null,
        userId: userData._id,
      }

      if (isPoll) {
        voteData.option = options[selectedOption]?._id
      } else if (post.type === "survey") {
        if (questionType === "multiple-choice") {
          voteData.option = options[selectedOption]?._id
        } else if (questionType === "open-ended") {
          voteData.response = openEndedResponse
        } else if (questionType === "rating") {
          voteData.rating = rating
        }
      }

      await onVote(post._id, voteData)
      setIsSubmitting(false)
    }
  }, [selectedOption, openEndedResponse, rating, userData?._id, isPoll, options, post, questionType, onVote])

  const handleOptionChange = useCallback((index) => {
    setSelectedOption(index)
  }, [])

  const handleRatingChange = useCallback((newRating) => {
    setRating(newRating)
  }, [])

  const handleTextareaChange = useCallback((e) => {
    setOpenEndedResponse(e.target.value)
    setCharCount(e.target.value.length)
  }, [])

  const toggleBookmark = useCallback(() => {
    setIsBookmarked(!isBookmarked)
    toast.success(isBookmarked ? "Removed from bookmarks" : "Added to bookmarks")
  }, [isBookmarked])

  const handleViewResultsClick = useCallback(async () => {
    if (!showResults) {
      const fetchedResults = await onViewResults(post._id)
      setResults(fetchedResults)
    }
    setShowResults(!showResults)
  }, [onViewResults, post._id, showResults])

  const renderResults = useMemo(() => {
    if (status !== "past" || !results || !showResults) return null

    if (post.type === "poll") {
      return (
        <div className="survey-card-results-container">
          <h4 className="results-title">Poll Results</h4>
          <div className="survey-card-results">
            {results.poll.options.map((option, index) => {
              const colorClasses = ["blue", "purple", "green", "orange", "red"]
              const colorClass = colorClasses[index % colorClasses.length]
              const percentage =
                results.poll.totalVotes > 0 ? Math.round((option.votes / results.poll.totalVotes) * 100) : 0
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
              )
            })}
            <div className="survey-card-total-votes">
              <PieChart className="total-votes-icon" />
              <span>Total Votes: {results.poll.totalVotes}</span>
            </div>
          </div>
        </div>
      )
    } else if (post.type === "survey") {
      return (
        <div className="survey-card-results-container">
          <h4 className="results-title">Survey Results</h4>
          <div className="survey-card-results">
            {results.survey.questions.map((question, qIndex) => (
              <div key={qIndex} className="survey-question-results">
                <h5 className="question-title">{question.question}</h5>
                {question.type === "multiple-choice" ? (
                  <>
                    {question.options.map((option, oIndex) => {
                      const colorClasses = ["blue", "purple", "green", "orange", "red"]
                      const colorClass = colorClasses[oIndex % colorClasses.length]
                      const percentage =
                        question.totalVotes > 0 ? Math.round((option.votes / question.totalVotes) * 100) : 0
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
                      )
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
      )
    }
    return null
  }, [status, results, post.type, showResults])

  const renderOptions = useMemo(() => {
    if (status !== "active") return null

    if (questionType === "multiple-choice") {
      return options.map((option, index) => (
        <div
          key={isPoll ? option._id : index}
          className={`survey-card-option ${selectedOption === index ? "selected" : ""}`}
          onClick={() => handleOptionChange(index)}
        >
          <div className="survey-card-radio-container">
            <input
              type="radio"
              id={`option-${post._id}-${isPoll ? option._id : index}`}
              name={`survey-${post._id}`}
              value={isPoll ? option.text : option.text}
              checked={selectedOption === index}
              onChange={() => handleOptionChange(index)}
              className="survey-card-radio"
            />
            <span className="survey-card-radio-checkmark"></span>
          </div>
          <label htmlFor={`option-${post._id}-${isPoll ? option._id : index}`} className="survey-card-option-label">
            {isPoll ? option.text : option.text}
          </label>
        </div>
      ))
    } else if (questionType === "open-ended") {
      return (
        <div className={`survey-card-open-ended ${isFocused ? "focused" : ""}`}>
          <div className="textarea-container">
            <MessageSquare className="textarea-icon" />
            <textarea
              className="survey-card-textarea"
              placeholder="Type your response here..."
              value={openEndedResponse}
              onChange={handleTextareaChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
            <div className="textarea-border"></div>
          </div>
          <div className="textarea-footer">
            <div className="char-count">
              <span className={charCount > 0 ? "has-text" : ""}>{charCount}</span> characters
            </div>
            <div className="textarea-hint">
              <Info className="hint-icon" />
              <span>Be concise and specific in your response</span>
            </div>
          </div>
        </div>
      )
    } else if (questionType === "rating") {
      return (
        <div className="survey-card-rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`survey-card-star ${star <= rating ? "filled" : ""}`}
              onClick={() => handleRatingChange(star)}
            >
              <Star className={`star-icon ${star <= rating ? "filled" : ""}`} />
            </span>
          ))}
          <div className="rating-label">
            {rating === 0 && "Select a rating"}
            {rating === 1 && "Poor"}
            {rating === 2 && "Fair"}
            {rating === 3 && "Good"}
            {rating === 4 && "Very Good"}
            {rating === 5 && "Excellent"}
          </div>
        </div>
      )
    }
    return null
  }, [
    status,
    questionType,
    options,
    isPoll,
    post._id,
    selectedOption,
    handleOptionChange,
    isFocused,
    openEndedResponse,
    handleTextareaChange,
    rating,
    handleRatingChange,
  ])

  return (
    <div
      className={`survey-card ${isHovered ? "hovered" : ""} ${status === "active" || status === "upcoming" ? "compact" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
            <span className="survey-card-creator">
              <User className="meta-icon" />
              <span className="creator-name">{post.createdBy.username}</span>
            </span>
          </div>
        </div>
        <span className={`survey-card-badge ${getStatusClass(status)}`}>
          {getStatusIcon(status)}
          {status}
        </span>
      </div>

      <div className="survey-card-deadline">
        <Calendar className="deadline-icon" />
        {getDeadlineText()}
      </div>

      {hasImages && (
        <div className="survey-card-images">
          <ImageCarousel images={post.attachments.map((attachment) => attachment.url)} />
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
        <div className="survey-card-actions">
          <button
            className={`survey-card-action-button ${isBookmarked ? "active" : ""}`}
            onClick={toggleBookmark}
            aria-label={isBookmarked ? "Remove bookmark" : "Bookmark this survey"}
          >
            <Bookmark className="action-icon" />
          </button>
          <button
            className="survey-card-action-button"
            aria-label="Share this survey"
            onClick={() => toast.info("Sharing options coming soon!")}
          >
            <Share2 className="action-icon" />
          </button>
          <button
            className="survey-card-action-button"
            aria-label="More options"
            onClick={() => toast.info("More options coming soon!")}
          >
            <MoreHorizontal className="action-icon" />
          </button>
        </div>

        {status === "active" ? (
          <button
            className={`survey-card-button submit-button ${
              (selectedOption === null && !openEndedResponse && rating === 0) || hasParticipated ? "disabled" : ""
            } ${isSubmitting ? "submitting" : ""}`}
            disabled={
              (selectedOption === null && !openEndedResponse && rating === 0) || hasParticipated || isSubmitting
            }
            onClick={handleSubmit}
          >
            {isSubmitting ? (
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
          <button className="survey-card-button results-button" onClick={handleViewResultsClick}>
            <BarChart3 className="button-icon" />
            {showResults ? "Hide Results" : "View Full Results"}
          </button>
        )}
      </div>
    </div>
  )
}

export default SurveyCard
