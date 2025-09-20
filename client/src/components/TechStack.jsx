"use client"

import { useEffect, useRef, useState } from "react"
import "./TechStack.css"

const TechStack = () => {
  const [visibleTechs, setVisibleTechs] = useState([])
  const sectionRef = useRef(null)

  const technologies = [
    { name: "React", icon: "⚛️", color: "#61dafb" },
    { name: "Node.js", icon: "🟢", color: "#68a063" },
    { name: "MongoDB", icon: "🍃", color: "#4db33d" },
    { name: "Express", icon: "🚀", color: "#ffffff" },
    { name: "Socket.io", icon: "🔌", color: "#010101" },
    { name: "Cron", icon: "⌚", color: "#30a4b4ff" },

  ]

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number.parseInt(entry.target.dataset.index)
            setVisibleTechs((prev) => [...new Set([...prev, index])])
          }
        })
      },
      { threshold: 0.1 },
    )

    const techs = sectionRef.current?.querySelectorAll(".tech-item")
    techs?.forEach((tech) => observer.observe(tech))

    return () => observer.disconnect()
  }, [])

  return (
    <section className="tech-stack section" ref={sectionRef}>
      <div className="container">
        <h2 className="section-title">Built with Modern Technology</h2>
        <p className="tech-subtitle">
          Leveraging the latest technologies to deliver a robust, scalable, and performant platform
        </p>
        <div className="tech-grid">
          {technologies.map((tech, index) => (
            <div
              key={index}
              data-index={index}
              className={`tech-item ${visibleTechs.includes(index) ? "visible" : ""}`}
              style={{ "--tech-color": tech.color }}
            >
              <div className="tech-icon">{tech.icon}</div>
              <span className="tech-name">{tech.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default TechStack
