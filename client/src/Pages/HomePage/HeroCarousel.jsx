import { useState,useEffect } from "react"
import { getTimeAgo,formatDate } from "./Helpers"

export const HeroCarousel = ({ items, navigate, posts }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Function to get recent posts with images from each category
  const getFeaturedPosts = () => {
    const categories = ["issue", "poll", "general", "marketplace", "announcements", "survey"]
    const featuredPosts = []

    categories.forEach((category) => {
      // Find the most recent post in this category that has images
      const postWithImages = posts
        .filter((post) => post.type === category && post.attachments?.length > 0)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]

      // If no post with images, get the most recent post regardless
      if (!postWithImages) {
        const recentPost = posts
          .filter((post) => post.type === category)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
        if (recentPost) featuredPosts.push(recentPost)
      } else {
        featuredPosts.push(postWithImages)
      }
    })

    return featuredPosts.filter(Boolean) // Remove any undefined entries
  }

  // Use the items prop directly or fallback to getFeaturedPosts
  const carouselItems = items || getFeaturedPosts()

  const handleNext = (e) => {
    e?.stopPropagation()
    if (isTransitioning || !carouselItems || carouselItems.length <= 1) return
    setIsTransitioning(true)
    setCurrentIndex((prevIndex) => (prevIndex + 1) % carouselItems.length)
    setTimeout(() => setIsTransitioning(false), 600)
  }

  const handlePrev = (e) => {
    e?.stopPropagation()
    if (isTransitioning || !carouselItems || carouselItems.length <= 1) return
    setIsTransitioning(true)
    setCurrentIndex((prevIndex) => (prevIndex - 1 + carouselItems.length) % carouselItems.length)
    setTimeout(() => setIsTransitioning(false), 600)
  }

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 100) {
      handleNext()
    }
    if (touchEnd - touchStart > 100) {
      handlePrev()
    }
  }

  useEffect(() => {
    // Auto-advance the carousel
    const interval = setInterval(() => {
      handleNext()
    }, 5000)

    return () => clearInterval(interval)
  }, [currentIndex])

  if (!carouselItems || carouselItems.length === 0) {
    return null
  }

  return (
    <div className="ts-hero-carousel">
      <div
        className="ts-hero-container"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={`ts-hero-track ${isTransitioning ? "transitioning" : ""}`}
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {carouselItems.map((item, index) => (
            <div key={`hero-slide-${index}`} className="ts-hero-slide">
              <div
                className="ts-hero-card"
                onClick={() => {
                  if (item.type === "announcements") {
                    navigate(`/announcements/`)
                  } else if (item.type === "poll") {
                    navigate(`/surveys/`)
                  } else if (item.type === "marketplace") {
                    navigate(`/marketplace/`)
                  } else if (item.type === "survey") {
                    navigate(`/surveys/`)
                  } else {
                    navigate(`/post/${item._id}`)
                  }
                }}
              >
                <div className="ts-hero-image">
                  {item.attachments &&
                  item.attachments.length > 0 &&
                  item.attachments[0].fileType?.startsWith("image/") ? (
                    <img
                      src={
                        item.attachments[0].url ||
                        "/placeholder.svg?height=500&width=1000" ||
                        "/placeholder.svg" ||
                        "/placeholder.svg" ||
                        "/placeholder.svg"
                      }
                      alt={item.title}
                      loading={index === 0 ? "eager" : "lazy"}
                      width="1000"
                      height="500"
                    />
                  ) : (
                    <div className="ts-hero-image-placeholder">
                      {item.type === "announcements" ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="48"
                          height="48"
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
                      ) : item.type === "poll" ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="48"
                          height="48"
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
                      ) : item.type === "marketplace" ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="48"
                          height="48"
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
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="48"
                          height="48"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                      )}
                    </div>
                  )}
                  <div className="ts-hero-overlay">
                    <div className="ts-hero-content">
                      <span className={`ts-hero-badge ts-hero-badge-${item.type}`}>{item.type}</span>
                      <h2 className="ts-hero-title">{item.title}</h2>
                      <p className="ts-hero-description">{item.description.substring(0, 120)}...</p>
                      <div className="ts-hero-meta">
                        <span className="ts-hero-author">
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
                            className="ts-hero-meta-icon"
                          >
                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                          {item.createdBy?.username || "Anonymous"}
                        </span>
                        <span className="ts-hero-time">
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
                            className="ts-hero-meta-icon"
                          >
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                          {getTimeAgo(item.createdAt)}
                        </span>
                      </div>
                      <button className="ts-hero-button">
                        Read More
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
                        >
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                          <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={(e) => {
            handlePrev(e)
            e.stopPropagation()
          }}
          className="ts-hero-control ts-hero-control-prev"
          aria-label="Previous slide"
        >
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
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <button
          onClick={(e) => {
            handleNext(e)
            e.stopPropagation()
          }}
          className="ts-hero-control ts-hero-control-next"
          aria-label="Next slide"
        >
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
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>

      <div className="ts-hero-indicators">
        {carouselItems.map((_, index) => (
          <button
            key={`hero-indicator-${index}`}
            className={`ts-hero-indicator ${index === currentIndex ? "active" : ""}`}
            onClick={(e) => {
              e.stopPropagation()
              setCurrentIndex(index)
            }}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}