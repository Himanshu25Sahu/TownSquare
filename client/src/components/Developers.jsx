"use client"

import { useEffect, useRef, useState } from "react"
import "./Developers.css"

const Developers = () => {
  const [visibleDevs, setVisibleDevs] = useState([])
  const sectionRef = useRef(null)

  const developers = [
    {
      name: "Himanshu Sahu",
      role: "Full Stack Developer",
      bio: "Computer Science | Full Stack Development | DevOps & Scalable Systems",
      avatar: "/himanshu.jpeg",
      skills: ["React", "C++","Node.js", "MongoDB", "Docker","Next.js"],
      github: "https://github.com/Himanshu25Sahu/",
      linkedin: "https://www.linkedin.com/in/himanshu-sahu-303b2b25a/",
    },
    {
      name: "JM Mushraf",
      role: "Full Stack Developer",
      bio: "Computer Science Engineer | C, C++ | DSA & Algorithms | Full Stack Development | DevOps & Scalable Systems",
      avatar: "/mushraf.jpg",
      skills: ["React", "Node.js", "JavaScript", "Docker","Kubernetes","MongoDB"],
      github: "https://github.com/JM-Mushraf",
      linkedin: "https://www.linkedin.com/in/mushraf-jm-386564306/",
    },

  ]

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number.parseInt(entry.target.dataset.index)
            setVisibleDevs((prev) => [...new Set([...prev, index])])
          }
        })
      },
      { threshold: 0.1 },
    )

    const devs = sectionRef.current?.querySelectorAll(".developer-card")
    devs?.forEach((dev) => observer.observe(dev))

    return () => observer.disconnect()
  }, [])

  return (
    <section className="developers section" ref={sectionRef}>
      <div className="container">
        <h2 className="section-title">Meet the Team</h2>
        <p className="developers-subtitle">The talented individuals behind TownSquare's innovative platform</p>

        <div className="developers-grid">
          {developers.map((developer, index) => (
            <div
              key={index}
              data-index={index}
              className={`developer-card ${visibleDevs.includes(index) ? "visible" : ""}`}
            >
              <div className="developer-avatar">
                <img src={developer.avatar || "/placeholder.svg"} alt={developer.name} />
                <div className="avatar-overlay">
                  <div className="social-links">
                    <a href={developer.github} target="_blank" rel="noopener noreferrer">
                      <span className="social-icon">🐙</span>
                    </a>
                    <a href={developer.linkedin} target="_blank" rel="noopener noreferrer">
                      <span className="social-icon">💼</span>
                    </a>
                  </div>
                </div>
              </div>

              <div className="developer-info">
                <h3 className="developer-name">{developer.name}</h3>
                <p className="developer-role">{developer.role}</p>
                <p className="developer-bio">{developer.bio}</p>

                <div className="developer-skills">
                  {developer.skills.map((skill, skillIndex) => (
                    <span key={skillIndex} className="skill-tag">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Developers
