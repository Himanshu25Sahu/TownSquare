import { useState, useEffect, lazy, Suspense } from "react";
import axios from "axios";
import { useTheme } from "../../components/ThemeProvider";
import ThemeToggle from "../../components/ThemeToggle";
import { useSelector } from "react-redux";
import "./HomePage.css";
import { throttle } from 'lodash';
import "react-toastify/dist/ReactToastify.css";
import { getTimeAgo, formatDate } from "./Helpers";
const HeroCarousel = lazy(() => import("./HeroCarousel").then(module => ({ default: module.HeroCarousel })));
const PostCard = lazy(() => import("./PostCard/PostCard").then(module => ({ default: module.PostCard })));
import { toast } from "react-hot-toast";
import { useCallback, useMemo } from "react";

// Create axios instance with interceptor
const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_BASEURL,
  withCredentials: true,
});

function HomePage() {
  const [activeTab, setActiveTab] = useState("all");
  const [pageData, setPageData] = useState({
    posts: [],
    trendingPosts: [],
    upcomingEvents: [],
    county: "",
    communities: []
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage] = useState(5); // Number of posts per page
  const [totalPosts, setTotalPosts] = useState(0); // Total number of posts
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [contactStates, setContactStates] = useState({});
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [isTokenLoading, setIsTokenLoading] = useState(true);
  const { userData, token } = useSelector((state) => state.user);

  // Add request and response interceptors
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.error("Authentication error - token might be invalid:", token);
          toast.error("Please login again to access this resource!");
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [token]);

  const navigate = (path) => {
    window.location.href = path;
  };

  useEffect(() => {
    if (token) {
      setIsTokenLoading(false);
    }
  }, [token]);

  // Reset currentPage when activeTab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Fetch data with pagination and type filter
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (!token) {
          console.log("No token available, skipping fetch");
          setLoading(false);
          return;
        }

        // Construct type query parameter based on activeTab
        const typeParam = activeTab === "all" ? "" : activeTab === "events" ? "announcements" : activeTab;

        // Fetch paginated posts with type filter
        const response = await api.get(`/post/getFeed?page=${currentPage}&limit=${postsPerPage}${typeParam ? `&type=${typeParam}` : ""}`);

        if (response.data) {
          setPageData(prev => ({
            ...prev,
            posts: response.data.posts || [],
            trendingPosts: response.data.trending || [],
            upcomingEvents: response.data.upcomingEvents || [],
            county: response.data.county || ""
          }));
          setTotalPosts(response.data.totalPosts || 0); // Set total posts from API response

          if (!response.data.trending && response.data.posts?.length > 0) {
            const postWithHighestUpvotes = response.data.posts.reduce(
              (prev, current) => (prev.upVotes > current.upVotes ? prev : current),
              {}
            );
            setPageData(prev => ({ ...prev, trendingPosts: [postWithHighestUpvotes] }));
          }
        }

        if (userData?.communitiesJoined?.length > 0) {
          try {
            const queryParams = new URLSearchParams();
            userData.communitiesJoined.forEach((name) => {
              queryParams.append("names", name);
            });

            const communityResponse = await api.get(`/user/chat/getCommunities?${queryParams.toString()}`);
            setPageData(prev => ({
              ...prev,
              communities: communityResponse.data?.communities || []
            }));
          } catch (error) {
            console.error("Error fetching communities:", error);
            setPageData(prev => ({ ...prev, communities: [] }));
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        if (error.response) {
          console.error("Error response data:", error.response.data);
          console.error("Error status:", error.response.status);
          console.error("Error headers:", error.response.headers);
        } else if (error.request) {
          console.error("Error request:", error.request);
        } else {
          console.error("Error message:", error.message);
        }
        setPageData(prev => ({
          ...prev,
          posts: [],
          trendingPosts: [],
          upcomingEvents: [],
          county: "",
          communities: []
        }));
        setTotalPosts(0);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token, userData, currentPage, postsPerPage, activeTab]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    const throttledScroll = throttle(handleScroll, 100);
    window.addEventListener('scroll', throttledScroll);
    
    return () => window.removeEventListener('scroll', throttledScroll);
  }, []);

  // Remove client-side filtering since it's handled by the backend
  const paginatedPosts = pageData.posts; // Use posts directly from API response

  // Calculate total pages
  const totalPages = Math.ceil(totalPosts / postsPerPage);

  // Handle page navigation
  const handlePageChange = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top on page change
    }
  }, [totalPages]);

  const contactHandlers = useMemo(() => ({
    handleContactSeller: (postId) => (e) => {
      e.stopPropagation();
      setContactStates(prev => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          showContactForm: !prev[postId]?.showContactForm,
        },
      }));
    },
    handleSendMessage: (postId) => (e) => {
      e.stopPropagation();
      if (contactStates[postId]?.contactMessage?.trim()) {
        alert(`Message sent to seller: ${contactStates[postId].contactMessage}`);
        setContactStates(prev => ({
          ...prev,
          [postId]: {
            ...prev[postId],
            contactMessage: "",
            showContactForm: false,
          },
        }));
      }
    },
    handleContactMessageChange: (postId) => (e) => {
      setContactStates(prev => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          contactMessage: e.target.value,
        },
      }));
    }
  }), [contactStates]);

  const memoizedPostCards = useMemo(() => 
    paginatedPosts.map((post) => {
      const postId = post._id;
      return (
        <Suspense key={`post-card-${postId}`} fallback={<div>Loading post...</div>}>
          <PostCard
            post={{
              ...post,
              showContactForm: contactStates[postId]?.showContactForm || false,
              contactMessage: contactStates[postId]?.contactMessage || "",
              ...contactHandlers
            }}
            navigate={navigate}
            token={token}
          />
        </Suspense>
      );
    }),
    [paginatedPosts, contactStates, contactHandlers, navigate, token]
  );

  // Add pagination styles
  useEffect(() => {
    const styleElement = document.createElement("style");
    const styles = `
      .ts-comments-section {
        margin-top: 1rem;
        padding: 1rem;
        border-top: 1px solid var(--border-color);
      }

      .ts-comments-header {
        margin-bottom: 1rem;
      }

      .ts-comments-title {
        font-size: 1rem;
        font-weight: 600;
      }

      .ts-comment-form {
        display: flex;
        margin-bottom: 1rem;
      }

      .ts-comment-input {
        flex: 1;
        padding: 0.75rem;
        border: 1px solid var(--border-color);
        border-radius: 0.5rem;
        background-color: var(--input-bg);
        color: var(--text-color);
      }

      .ts-comment-submit {
        margin-left: 0.5rem;
        padding: 0.5rem;
        border: none;
        border-radius: 0.5rem;
        background-color: var(--primary-color);
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .ts-comment-submit:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .ts-comments-loading,
      .ts-comments-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        color: var(--text-muted);
      }

      .ts-comments-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .ts-comment-item {
        display: flex;
        gap: 0.75rem;
      }

      .ts-comment-avatar {
        width: 2rem;
        height: 2rem;
        border-radius: 50%;
        background-color: var(--avatar-bg);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: var(--avatar-text);
        overflow: hidden;
      }

      .ts-comment-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .ts-comment-content {
        flex: 1;
        background-color: var(--comment-bg);
        border-radius: 0.5rem;
        padding: 0.75rem;
      }

      .ts-comment-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.25rem;
      }

      .ts-comment-author {
        font-weight: 600;
        font-size: 0.875rem;
        margin: 0;
      }

      .ts-comment-time {
        font-size: 0.75rem;
        color: var(--text-muted);
      }

      .ts-comment-text {
        margin: 0;
        font-size: 0.875rem;
        line-height: 1.4;
      }

      .ts-action-button.active {
        color: var(--primary-color);
      }

      /* Pagination Styles */
      .ts-pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.5rem;
        margin-top: 1rem;
        padding: 1rem;
      }

      .ts-pagination-button {
        padding: 0.5rem 1rem;
        border: 1px solid var(--border-color);
        border-radius: 0.5rem;
        background-color: var(--input-bg);
        color: var(--text-color);
        cursor: pointer;
        font-size: 0.875rem;
        transition: background-color 0.2s;
      }

      .ts-pagination-button:hover:not(:disabled) {
        background-color: var(--primary-color);
        color: white;
      }

      .ts-pagination-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .ts-pagination-button.active {
        background-color: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }

      /* Dark mode specific styles */
      .dark .ts-comment-input,
      .dark .ts-pagination-button {
        background-color: var(--dark-input-bg);
        border-color: var(--dark-border-color);
      }

      .dark .ts-comment-content {
        background-color: var(--dark-comment-bg);
      }

      .dark .ts-pagination-button.active {
        background-color: var(--primary-color);
        border-color: var(--primary-color);
      }
    `;
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  if (isTokenLoading) {
    return <div>Loading authentication...</div>;
  }

  return (
    <div className="ts-home-container">
      {/* Header Section */}
      <header className={`ts-home-header ${isScrolled ? "scrolled" : ""}`}>
        <div className="ts-header-content">
          <div className="ts-header-text">
            <h1 className="ts-home-title">
              Welcome to <span className="ts-gradient-text">TownSquare</span>
            </h1>
            <div className="ts-title-underline"></div>
            <p className="ts-home-subtitle">
              Your community platform for {pageData.county || "your local area"}
            </p>
          </div>
          <div className="ts-header-actions">
            <ThemeToggle />
            <button
              className="ts-create-button"
              onClick={() => navigate("/createPost")}
              id="create-post-button"
            >
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
                className="ts-button-icon"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>Create Post</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="ts-home-content">
        {loading ? (
          <div className="ts-loading-container">
            <div className="ts-loading-spinner"></div>
            <p>Loading community content...</p>
          </div>
        ) : (
          <>
            {/* Hero Carousel */}
            {pageData.posts.length > 0 && (
              <HeroCarousel
                items={pageData.posts
                  .filter(
                    (post) => post.attachments && post.attachments.length > 0
                  )
                  .slice(0, 5)}
                navigate={navigate}
              />
            )}

            {/* Quick Links */}
            <div className="ts-quick-links">
              <div
                className="ts-quick-link"
                onClick={() => setActiveTab("all")}
                id="quick-link-all"
              >
                <div className="ts-quick-link-icon">
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
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                </div>
                <span>All</span>
              </div>
              <div
                className="ts-quick-link"
                onClick={() => setActiveTab("marketplace")}
                id="quick-link-marketplace"
              >
                <div className="ts-quick-link-icon">
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
                    <path d="M20 12V8H6a2 2 0 01-2-2c0-1.1.9-2 2-2h12v4"></path>
                    <path d="M4 6v12c0 1.1.9 2 2 2h14v-4"></path>
                    <path d="M18 12a2 2 0 000 4h4v-4h-4z"></path>
                  </svg>
                </div>
                <span>Marketplace</span>
              </div>
              <div
                className="ts-quick-link"
                onClick={() => setActiveTab("polls")}
                id="quick-link-polls"
              >
                <div className="ts-quick-link-icon">
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
                    <path d="M18 20V10"></path>
                    <path d="M12 20V4"></path>
                    <path d="M6 20v-6"></path>
                  </svg>
                </div>
                <span>Polls</span>
              </div>
              <div
                className="ts-quick-link"
                onClick={() => setActiveTab("announcements")}
                id="quick-link-announcements"
              >
                <div className="ts-quick-link-icon">
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
                    <path d="M3 11l18-5v12L3 14v-3z"></path>
                    <path d="M11.6 16.8a3 3 0 11-5.8-1.6"></path>
                  </svg>
                </div>
                <span>Announcements</span>
              </div>
              <div
                className="ts-quick-link"
                onClick={() => setActiveTab("issues")}
                id="quick-link-issues"
              >
                <div className="ts-quick-link-icon">
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
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                  </svg>
                </div>
                <span>Issues</span>
              </div>
            </div>

            <div className="ts-content-grid">
              {/* Main Feed */}
              <main className="ts-main-feed">
                <div className="ts-section-header">
                  <h2 className="ts-section-title">Community Feed</h2>
                </div>

                {paginatedPosts.length === 0 ? (
                  <div className="ts-empty-state">
                    <div className="ts-empty-icon-container">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="ts-empty-icon"
                      >
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                    </div>
                    <h3>No posts found</h3>
                    <p>
                      Be the first to create a post in {pageData.county || "your area"}!
                    </p>
                    <button
                      className="ts-create-button"
                      onClick={() => navigate("/createPost")}
                      id="create-post-empty"
                    >
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
                        className="ts-button-icon"
                      >
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                      <span>Create Post</span>
                    </button>
                  </div>
                ) : (
                  <div className="ts-posts-container">
                    {memoizedPostCards}
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="ts-pagination">
                        <button
                          className="ts-pagination-button"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          aria-label="Previous page"
                        >
                          Previous
                        </button>
                        {[...Array(totalPages).keys()].map((page) => (
                          <button
                            key={`page-${page + 1}`}
                            className={`ts-pagination-button ${currentPage === page + 1 ? 'active' : ''}`}
                            onClick={() => handlePageChange(page + 1)}
                            aria-label={`Page ${page + 1}`}
                            aria-current={currentPage === page + 1 ? 'page' : undefined}
                          >
                            {page + 1}
                          </button>
                        ))}
                        <button
                          className="ts-pagination-button"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          aria-label="Next page"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </main>
              <aside className="ts-sidebar">
                {/* Trending Section */}
                <div className="ts-sidebar-section">
                  <div className="ts-section-header">
                    <h2 className="ts-section-title">
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
                        className="ts-section-icon"
                      >
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                        <polyline points="17 6 23 6 23 12"></polyline>
                      </svg>
                      Trending Discussions
                    </h2>
                  </div>
                  <div className="ts-section-content">
                    {loading ? (
                      <div className="ts-loading-small">
                        <div className="ts-loading-spinner"></div>
                      </div>
                    ) : !pageData.trendingPosts || pageData.trendingPosts.length === 0 ? (
                      <div className="ts-empty-section">
                        No trending posts yet
                      </div>
                    ) : (
                      <div className="ts-trending-list">
                        {Array.isArray(pageData.trendingPosts) ? (
                          pageData.trendingPosts.map((post) => (
                            <div
                              key={post._id}
                              className="ts-trending-item"
                              onClick={() => navigate(`/post/${post._id}`)}
                            >
                              <h4 className="ts-trending-title">
                                {post.title}
                              </h4>
                              <div className="ts-trending-meta">
                                <span>{post.upVotes || 0} upvotes</span>
                                <span>{getTimeAgo(post.createdAt)}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div
                            className="ts-trending-item"
                            onClick={() => navigate(`/post/${pageData.trendingPosts._id}`)}
                          >
                            <h4 className="ts-trending-title">
                              {pageData.trendingPosts.title}
                            </h4>
                            <div className="ts-trending-meta">
                              <span>{pageData.trendingPosts.upVotes || 0} upvotes</span>
                              <span>{getTimeAgo(pageData.trendingPosts.createdAt)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Upcoming Events */}
                <div className="ts-sidebar-section">
                  <div className="ts-section-header">
                    <h2 className="ts-section-title">
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
                        className="ts-section-icon"
                      >
                        <rect
                          x="3"
                          y="4"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                        ></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      Upcoming Events
                    </h2>
                    <button
                      className="ts-view-all-button"
                      onClick={() => navigate("/events")}
                      id="view-all-events"
                    >
                      View All
                    </button>
                  </div>
                  <div className="ts-section-content">
                    {pageData.upcomingEvents.length === 0 ? (
                      <div className="ts-empty-section">No upcoming events</div>
                    ) : (
                      <div className="ts-events-list">
                        {pageData.upcomingEvents.slice(0, 3).map((event) => (
                          <div
                            key={`event-${event._id}`}
                            className="ts-event-item"
                            onClick={() => navigate(`/announcements/${event._id}`)}
                          >
                            <div className="ts-event-content">
                              <h3 className="ts-event-title">{event.title}</h3>
                              <div className="ts-event-meta">
                                <div className="ts-event-date">
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
                                    className="ts-meta-icon"
                                  >
                                    <rect
                                      x="3"
                                      y="4"
                                      width="18"
                                      height="18"
                                      rx="2"
                                      ry="2"
                                    ></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                  </svg>
                                  <span>{formatDate(event.date)}</span>
                                </div>
                                {event.location && (
                                  <div className="ts-event-location">
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
                                      className="ts-meta-icon"
                                    >
                                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                      <circle cx="12" cy="10" r="3"></circle>
                                    </svg>
                                    <span>{event.location}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Alert Card */}
                <div className="ts-alert-card">
                  <div className="ts-alert-icon-container">
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
                      className="ts-alert-icon"
                    >
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                  </div>
                  <div className="ts-alert-content">
                    <h3 className="ts-alert-title">Community Updates</h3>
                    <p className="ts-alert-message">
                      Stay tuned for important announcements and updates from
                      your community.
                    </p>
                  </div>
                </div>

                {/* Community Stats */}
                <div className="ts-stats-card">
                  <div className="ts-stats-header">
                    <h3 className="ts-stats-title">Community Stats</h3>
                    {pageData.communities[0] && (
                      <span className="ts-community-name">
                        {pageData.communities[0].name}
                      </span>
                    )}
                  </div>
                  <div className="ts-stats-content">
                    <div className="ts-stat-item" id="stat-members">
                      <div className="ts-stat-icon-container">
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
                          className="ts-stat-icon"
                        >
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 00-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                      </div>
                      <div className="ts-stat-info">
                        <span className="ts-stat-value">
                          {pageData.communities[0]?.members?.length || 0}
                        </span>
                        <span className="ts-stat-label">Members</span>
                      </div>
                    </div>
                    <div className="ts-stat-item" id="stat-posts">
                      <div className="ts-stat-icon-container">
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
                          className="ts-stat-icon"
                        >
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                      </div>
                      <div className="ts-stat-info">
                        <span className="ts-stat-value">
                          {
                            pageData.posts.filter(
                              (post) =>
                                post.community?._id ===
                                userData?.communitiesJoined?.[0]?._id
                            ).length
                          }
                        </span>
                        <span className="ts-stat-label">Posts</span>
                      </div>
                    </div>
                    <div className="ts-stat-item" id="stat-satisfaction">
                      <div className="ts-stat-icon-container">
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
                          className="ts-stat-icon"
                        >
                          <circle cx="12" cy="8" r="7"></circle>
                          <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
                        </svg>
                      </div>
                      <div className="ts-stat-info">
                        <span className="ts-stat-value">98%</span>
                        <span className="ts-stat-label">Satisfaction</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Support Card */}
                <div className="ts-support-card">
                  <div className="ts-support-icon-container">
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
                      className="ts-support-icon"
                    >
                      <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                      <line x1="6" y1="1" x2="6" y2="4"></line>
                      <line x1="10" y1="1" x2="10" y2="4"></line>
                      <line x1="14" y1="1" x2="14" y2="4"></line>
                    </svg>
                  </div>
                  <div className="ts-support-content">
                    <h3 className="ts-support-title">Support Your Community</h3>
                    <p className="ts-support-message">
                      Help us keep TownSquare running and improving for everyone.
                    </p>
                    <button className="ts-support-button" id="donate-button">
                      Donate Now
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default HomePage;