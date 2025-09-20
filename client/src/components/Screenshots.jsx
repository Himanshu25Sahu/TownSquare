"use client"

import { useState, useEffect, useRef } from "react"
import "./Screenshots.css"

const Screenshots = () => {
  const [selectedImage, setSelectedImage] = useState(null)
  const [visibleImages, setVisibleImages] = useState([])
  const sectionRef = useRef(null)

  const screenshots = [
    {
      id: 1,
      title: "Community Dashboard",
      description: "Main dashboard showing local communities and activities",
      url: "/home.jpeg",
    },
    {
      id: 2,
      title: "Event Creation",
      description: "Intuitive event creation interface with rich features",
      url: "/discussions.jpeg",
    },
    {
      id: 3,
      title: "Chat Interface",
      description: "Real-time messaging with community members",
      url: "/profile.jpeg",
    },
    {
      id: 4,
      title: "Profile Management",
      description: "Comprehensive user profile and settings page",
      url: "/market.jpeg",
    },
    {
      id: 5,
      title: "Mobile Experience",
      description: "Responsive design optimized for mobile devices",
      url: "/polls.jpeg",
    },
    {
      id: 6,
      title: "Analytics Dashboard",
      description: "Community insights and engagement analytics",
      url: "/announcements.jpeg",
    },
  ]

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number.parseInt(entry.target.dataset.index)
            setVisibleImages((prev) => [...new Set([...prev, index])])
          }
        })
      },
      { threshold: 0.1 },
    )

    const images = sectionRef.current?.querySelectorAll(".screenshot-item")
    images?.forEach((image) => observer.observe(image))

    return () => observer.disconnect()
  }, [])

  const openLightbox = (screenshot) => {
    setSelectedImage(screenshot)
  }

  const closeLightbox = () => {
    setSelectedImage(null)
  }

  return (
    <section className="screenshots section" ref={sectionRef}>
      <div className="container">
        <h2 className="section-title">See TownSquare in Action</h2>
        <p className="screenshots-subtitle">
          Explore the intuitive interface and powerful features that make community building effortless
        </p>

        <div className="screenshots-grid">
          {screenshots.map((screenshot, index) => (
            <div
              key={screenshot.id}
              data-index={index}
              className={`screenshot-item ${visibleImages.includes(index) ? "visible" : ""}`}
              onClick={() => openLightbox(screenshot)}
            >
              <div className="screenshot-image">
                <img src={screenshot.url || "/placeholder.svg"} alt={screenshot.title} />
                <div className="screenshot-overlay">
                  <div className="screenshot-overlay-content">
                    <h3>{screenshot.title}</h3>
                    <p>{screenshot.description}</p>
                    <span className="view-full">Click to view full size</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedImage && (
        <div className="lightbox" onClick={closeLightbox}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={closeLightbox}>
              ×
            </button>
            <img src={selectedImage.url || "/placeholder.svg"} alt={selectedImage.title} />
            <div className="lightbox-info">
              <h3>{selectedImage.title}</h3>
              <p>{selectedImage.description}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default Screenshots
