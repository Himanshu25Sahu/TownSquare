"use client"

import { useEffect, useState } from "react"
import "./Hero.css"
import { FiArrowDown } from "react-icons/fi" // scroll icon

const Hero = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section className="hero">
      <div className="hero-background">
        <div className="hero-gradient"></div>
        <div className="hero-particles">
          {[...Array(70)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            ></div>
          ))}
        </div>
      </div>

      <div className="container">
        <div className={`hero-content ${isVisible ? "visible" : ""}`}>
<h1 className="hero-title">
  Welcome to <span className="gradient-text">TownSquare</span>
</h1>
<p className="hero-subtitle">
  A modern community platform designed to bring people together through groups, events, and real-time chat — 
  built with cutting-edge web technologies for a seamless experience.
</p>


          <div className="hero-buttons">
                        <a href="https://town-square.onrender.com/login" target="_blank" rel="noopener noreferrer">
              <button className="btn-secondary">Visit Live</button>
            </a>
            <a href="https://github.com/Himanshu25Sahu/TownSquare" target="_blank" rel="noopener noreferrer">
              <button className="btn-primary">View GitHub</button>
            </a>

          </div>

          <div className="scroll-down">
            <FiArrowDown className="bounce" size={30} />
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
