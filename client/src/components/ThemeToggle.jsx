

import { useState, useEffect, useRef } from "react"
import { useTheme } from "./ThemeProvider"
import "./ThemeToggle.css"
import { Sun, Moon, Stars } from "lucide-react"

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const particlesRef = useRef(null)
  const animationRef = useRef(null)

  useEffect(() => {
    setMounted(true)
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (mounted && particlesRef.current) {
      initParticles()
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [mounted, theme])

  const initParticles = () => {
    const canvas = particlesRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    const particles = []
    const particleCount = 20

    canvas.width = 140
    canvas.height = 60

    for (let i = 0; i < particleCount; i++) {
      const alpha = 0.4 + Math.random() * 0.6
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 0.5,
        color:
          theme === "dark"
            ? `rgba(147, 197, 253, ${alpha})`
            : `rgba(59, 130, 246, ${alpha})`,
        speed: Math.random() * 0.6 + 0.3,
        direction: Math.random() * Math.PI * 2,
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((particle) => {
        particle.x += Math.cos(particle.direction) * particle.speed
        particle.y += Math.sin(particle.direction) * particle.speed

        if (particle.x < 0 || particle.x > canvas.width) {
          particle.direction = Math.PI - particle.direction
        }
        if (particle.y < 0 || particle.y > canvas.height) {
          particle.direction = -particle.direction
        }

        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
        ctx.fillStyle = particle.color
        ctx.fill()

        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.radius * 2.5, 0, Math.PI * 2)
        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.radius * 4
        )
        
        const baseColor = particle.color.split(',')
        const glowColor = `${baseColor[0]},${baseColor[1]},${baseColor[2]}, 0.4)`
        const transparentColor = `${baseColor[0]},${baseColor[1]},${baseColor[2]}, 0)`
        
        gradient.addColorStop(0, glowColor)
        gradient.addColorStop(1, transparentColor)
        ctx.fillStyle = gradient
        ctx.fill()
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()
  }

  const handleThemeChange = (newTheme) => {
    if (newTheme === theme) return

    setIsAnimating(true)
    setTimeout(() => {
      setTheme(newTheme)
      setTimeout(() => {
        setIsAnimating(false)
      }, 600)
    }, 150)
  }

  if (!mounted) return null

  return (
    <div className={`futuristic-theme-toggle ${isAnimating ? "animating" : ""}`} data-theme={theme}>
      <div className="toggle-backdrop">
        <canvas ref={particlesRef} className="particle-canvas" />
      </div>

      <div className="toggle-wrapper">
        <button
          onClick={() => handleThemeChange("light")}
          className={`toggle-option ${theme === "light" ? "active" : ""}`}
          aria-label="Light mode"
        >
          <div className="icon-wrapper">
            <Sun className="icon sun-icon" size={20} />
            <div className="icon-effect sun-effect"></div>
          </div>
        </button>

        <button
          onClick={() => handleThemeChange("dark")}
          className={`toggle-option ${theme === "dark" ? "active" : ""}`}
          aria-label="Dark mode"
        >
          <div className="icon-wrapper">
            <Moon className="icon moon-icon" size={20} />
            <Stars className="icon stars-icon" size={20} />
            <div className="icon-effect moon-effect"></div>
          </div>
        </button>

        <div className={`toggle-indicator ${theme}`}>
          <div className="indicator-core"></div>
          <div className="indicator-glow"></div>
          <div className="indicator-ring"></div>
        </div>
      </div>
    </div>
  )
}

export default ThemeToggle