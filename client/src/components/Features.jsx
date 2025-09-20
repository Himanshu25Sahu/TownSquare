"use client"

import { useEffect, useRef, useState } from "react"
import "./Features.css"

const Features = () => {
  const [visibleCards, setVisibleCards] = useState([])
  const sectionRef = useRef(null)

  const features = [
    {
      icon: "📢",
      title: "Post & Discuss Local Issues",
      description: "Raise concerns, ask questions, or get help from people nearby.",
    },
    {
      icon: "📊",
      title: "Create Polls & Surveys",
      description: "Make local decisions with collective input — from event planning to society rules.",
    },
    {
      icon: "🛍",
      title: "Local Marketplace",
      description: "Buy, sell, give away, or request items — all within your own community.",
    },
    {
      icon: "💬",
      title: "Community Chat",
      description: "One big chatroom for all — share events, emergencies, or just say hi 👋.",
    },
    {
      icon: "🏡",
      title: "Personalized Homepage",
      description: "See posts relevant only to your area and interests. No noise.",
    },
    {
      icon: "📣",
      title: "Announcements Page",
      description: "Admins can post society notices and updates with guaranteed visibility.",
    },
    {
      icon: "👤",
      title: "User Profiles",
      description: "Manage your posts, chats, bookmarks, and profile in one place.",
    },
    {
      icon: "🚨",
      title: "Emergency Contacts",
      description: "Quick access to local police, hospitals, fire stations, and more.",
    },
    // Upcoming AI/ML features
  ]

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number.parseInt(entry.target.dataset.index)
            setVisibleCards((prev) => [...new Set([...prev, index])])
          }
        })
      },
      { threshold: 0.1 },
    )

    const cards = sectionRef.current?.querySelectorAll(".feature-card")
    cards?.forEach((card) => observer.observe(card))

    return () => observer.disconnect()
  }, [])

  return (
    <section className="features section" ref={sectionRef}>
      <div className="container">
        <h2 className="section-title">Powerful Features</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div
              key={index}
              data-index={index}
              className={`feature-card ${visibleCards.includes(index) ? "visible" : ""}`}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features