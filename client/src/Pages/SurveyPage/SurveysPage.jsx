"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useSelector } from "react-redux"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import {
  CheckCircle,
  Clock,
  History,
  AlertTriangle,
  RefreshCw,
  HelpCircle,
  Award,
  ThumbsUp,
  TrendingUp,
  Filter,
  Search,
  ClipboardList,
} from "lucide-react"
import SurveyCard from "./SurveyCard/SurveyCard.jsx"
import "./SurveysPage.css"
import { useTheme } from "../../components/ThemeProvider.jsx"

function SurveysPage() {
  const [activeTab, setActiveTab] = useState("active")
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tabTransitioning, setTabTransitioning] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filters, setFilters] = useState({
    pollsOnly: false,
    surveysOnly: false,
    participatedOnly: false,
  })
  const { theme } = useTheme()
  const { token } = useSelector((state) => state.user)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_BASEURL}/post/survey-and-poll-posts`)
        if (!response.ok) throw new Error("Failed to fetch posts")
        const data = await response.json()
        setPosts(data.posts)
      } catch (error) {
        setError(error.message)
        toast.error("Failed to load surveys and polls. Please try again later.")
      } finally {
        setLoading(false)
      }
    }
    fetchPosts()
  }, [])

  const handleTabChange = useCallback(
    (tab) => {
      if (tab === activeTab || tabTransitioning) return
      setTabTransitioning(true)
      setTimeout(() => {
        setActiveTab(tab)
        setTabTransitioning(false)
      }, 300)
    },
    [activeTab, tabTransitioning],
  )

  const filteredPosts = useMemo(() => {
    let filtered = posts.filter((post) => {
      const status = post.poll ? post.poll.status : post.survey.status
      return status === activeTab
    })

    if (filters.pollsOnly) {
      filtered = filtered.filter((post) => post.type === "poll")
    }
    if (filters.surveysOnly) {
      filtered = filtered.filter((post) => post.type === "survey")
    }
    if (filters.participatedOnly) {
      filtered = filtered.filter((post) => {
        if (post.poll) {
          return post.poll.options?.some((opt) => opt.voters?.includes(token?.userId))
        } else if (post.survey) {
          return post.survey.questions?.some((q) => q.responses?.some((r) => r.userId === token?.userId))
        }
        return false
      })
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (post) => post.title.toLowerCase().includes(query) || post.description?.toLowerCase().includes(query),
      )
    }

    return filtered
  }, [posts, activeTab, filters, searchQuery, token?.userId])

  const handleVote = useCallback(
    async (postId, voteData) => {
      try {
        if (!token) {
          toast.error("You must be logged in to vote.")
          return
        }

        const response = await fetch(`${import.meta.env.VITE_BACKEND_BASEURL}/post/${postId}/vote`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify(voteData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Failed to submit vote")
        }

        setPosts((prevPosts) =>
          prevPosts.map((post) => {
            if (post._id !== postId) return post

            if (post.poll) {
              const updatedOptions = post.poll.options.map((opt) =>
                opt._id === voteData.option ? { ...opt, votes: opt.votes + 1 } : opt,
              )
              return { ...post, poll: { ...post.poll, options: updatedOptions } }
            } else if (post.survey) {
              const surveyQuestion = post.survey.questions[0]
              if (surveyQuestion.type === "multiple-choice") {
                const updatedVotes = [
                  ...surveyQuestion.votes,
                  { optionIndex: voteData.option, userId: voteData.userId },
                ]
                return {
                  ...post,
                  survey: {
                    ...post.survey,
                    questions: [{ ...surveyQuestion, votes: updatedVotes }],
                  },
                }
              } else if (surveyQuestion.type === "open-ended") {
                const updatedResponses = [
                  ...surveyQuestion.responses,
                  { response: voteData.response, userId: voteData.userId },
                ]
                return {
                  ...post,
                  survey: {
                    ...post.survey,
                    questions: [{ ...surveyQuestion, responses: updatedResponses }],
                  },
                }
              } else if (surveyQuestion.type === "rating") {
                const updatedRatings = [...surveyQuestion.ratings, { rating: voteData.rating, userId: voteData.userId }]
                return {
                  ...post,
                  survey: {
                    ...post.survey,
                    questions: [{ ...surveyQuestion, ratings: updatedRatings }],
                  },
                }
              }
            }
            return post
          }),
        )

        toast.success("Your vote has been submitted successfully!")
      } catch (error) {
        toast.error(error.message || "An error occurred while submitting your vote.")
      }
    },
    [token],
  )

  const handleViewResults = useCallback(
    async (postId) => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_BASEURL}/post/${postId}/results`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        })

        if (!response.ok) throw new Error("Failed to fetch results")
        const data = await response.json()
        return data.results
      } catch (error) {
        toast.error(error.message || "An error occurred while fetching results.")
        return null
      }
    },
    [token],
  )

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value)
  }, [])

  const toggleFilter = useCallback(() => {
    setIsFilterOpen((prev) => !prev)
  }, [])

  const handleFilterChange = useCallback((filter) => {
    setFilters((prev) => ({
      ...prev,
      [filter]: !prev[filter],
    }))
  }, [])

  if (loading) {
    return (
      <div className="surveys-loading">
        <div className="surveys-loading-spinner"></div>
        <p>Loading surveys and polls...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="surveys-error">
        <AlertTriangle className="surveys-error-icon" />
        <h3 className="surveys-error-title">Error Loading Surveys</h3>
        <p className="surveys-error-message">{error}</p>
        <button className="surveys-error-button" onClick={() => window.location.reload()}>
          <RefreshCw className="surveys-button-icon" />
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className={`surveys-container ${theme}`}>
      <div className="surveys-header">
        <h1 className="surveys-title">
          Surveys & <span className="surveys-gradient-text">Polls</span>
        </h1>
        <p className="surveys-subtitle">Share your opinion on community matters</p>
        <div className="surveys-search-container">
          <div className="surveys-search-box">
            <Search className="surveys-search-icon" />
            <input
              type="text"
              placeholder="Search surveys and polls..."
              className="surveys-search-input"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {searchQuery && (
              <button
                className="surveys-search-clear-button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
          <button
            className={`surveys-filter-button ${isFilterOpen ? "active" : ""}`}
            onClick={toggleFilter}
            aria-label="Filter options"
          >
            <Filter className="surveys-filter-icon" />
          </button>
        </div>
        {isFilterOpen && (
          <div className="surveys-filter-dropdown">
            <div className="surveys-filter-option">
              <input
                type="checkbox"
                id="filter-polls"
                checked={filters.pollsOnly}
                onChange={() => handleFilterChange("pollsOnly")}
              />
              <label htmlFor="filter-polls">Polls only</label>
            </div>
            <div className="surveys-filter-option">
              <input
                type="checkbox"
                id="filter-surveys"
                checked={filters.surveysOnly}
                onChange={() => handleFilterChange("surveysOnly")}
              />
              <label htmlFor="filter-surveys">Surveys only</label>
            </div>
            <div className="surveys-filter-option">
              <input
                type="checkbox"
                id="filter-participated"
                checked={filters.participatedOnly}
                onChange={() => handleFilterChange("participatedOnly")}
                disabled={!token || !token.userId}
              />
              <label htmlFor="filter-participated">
                Participated
                {!token || !token.userId ? " (Login required)" : ""}
              </label>
            </div>
            <button
              className="surveys-filter-apply-button"
              onClick={() => {
                setIsFilterOpen(false)
                toast.success("Filters applied successfully!")
              }}
            >
              Apply Filters
            </button>
          </div>
        )}
      </div>

      <div className="surveys-tabs">
        <div className="surveys-tabs-list">
          <button
            className={`surveys-tab ${activeTab === "active" ? "active" : ""}`}
            onClick={() => handleTabChange("active")}
          >
            <CheckCircle className="surveys-tab-icon" />
            Active
          </button>
          <button
            className={`surveys-tab ${activeTab === "upcoming" ? "active" : ""}`}
            onClick={() => handleTabChange("upcoming")}
          >
            <Clock className="surveys-tab-icon" />
            Upcoming
          </button>
          <button
            className={`surveys-tab ${activeTab === "past" ? "active" : ""}`}
            onClick={() => handleTabChange("past")}
          >
            <History className="surveys-tab-icon" />
            Past
          </button>
        </div>
        <div className={`surveys-tab-content ${tabTransitioning ? "surveys-tab-transitioning" : ""}`}>
          {filteredPosts.length > 0 ? (
            <div className="surveys-grid">
              {filteredPosts.map((post) => (
                <SurveyCard key={post._id} post={post} onVote={handleVote} onViewResults={handleViewResults} />
              ))}
            </div>
          ) : (
            <div className="surveys-empty">
              <div className="surveys-empty-icon-container">
                <ClipboardList className="surveys-empty-icon" />
              </div>
              <p>
                No {activeTab} surveys or polls {searchQuery ? "matching your search" : "at the moment"}.
              </p>
              {searchQuery && (
                <button className="surveys-clear-search-button" onClick={() => setSearchQuery("")}>
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="surveys-footer">
        <div className="surveys-stats">
          <div className="surveys-stat-item">
            <TrendingUp className="surveys-stat-icon" />
            <div className="surveys-stat-content">
              <span className="surveys-stat-value">{posts.length}</span>
              <span className="surveys-stat-label">Total Surveys & Polls</span>
            </div>
          </div>
          <div className="surveys-stat-item">
            <Award className="surveys-stat-icon" />
            <div className="surveys-stat-content">
              <span className="surveys-stat-value">
                {posts.filter((post) => post.poll?.status === "active" || post.survey?.status === "active").length}
              </span>
              <span className="surveys-stat-label">Active Now</span>
            </div>
          </div>
          <div className="surveys-stat-item">
            <ThumbsUp className="surveys-stat-icon" />
            <div className="surveys-stat-content">
              <span className="surveys-stat-value">98%</span>
              <span className="surveys-stat-label">Participation Rate</span>
            </div>
          </div>
        </div>
        <div className="surveys-help">
          <HelpCircle className="surveys-help-icon" />
          <p>
            Need help creating your own survey?{" "}
            <a href="#" className="surveys-help-link">
              Check our guide
            </a>
          </p>
        </div>
      </div>
      <ToastContainer position="bottom-right" autoClose={5000} />
    </div>
  )
}

export default SurveysPage
