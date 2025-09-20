import React,{ useState, useEffect, useMemo, useCallback } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { logout } from "../Slices/AuthSlice"
import ThemeToggle from "./ThemeToggle"
// import "./Sidebar.css"

// Icons (consider dynamic imports if bundle size is a concern)
import {
  Home,
  MessageSquare,
  FileText,
  Vote,
  ShoppingBag,
  Phone,
  ChevronLeft,
  ChevronRight,
  LogIn,
  LogOut,
  Menu,
  X,
} from "./Icons"

// Split sidebar items into a separate config file or memoize
const sidebarConfig = [
  {
    section: "Main",
    items: [
      { icon: <Home />, label: "Home", href: "/", badge: null },
      { icon: <MessageSquare />, label: "Discussions", href: "/discussions"},
      { icon: <FileText />, label: "Announcements", href: "/announcements"},
    ],
  },
  {
    section: "Engagement",
    items: [
      { icon: <Vote />, label: "Surveys & Polls", href: "/surveys", badge: null },
      { icon: <ShoppingBag />, label: "Marketplace", href: "/marketplace", badge: null },
    ],
  },
  {
    section: "Services",
    items: [{ icon: <Phone />, label: "Emergency", href: "/emergency", badge: null, isEmergency: true }],
  },
]

// Split SidebarItem into a separate component to optimize rendering
const SidebarItem = React.memo(({ item, isActive, isCollapsed, isMobileOpen }) => (
  <Link
    to={item.href}
    className={`sidebar-nav-item ${isActive ? "active" : ""}`}
    aria-current={isActive ? "page" : undefined}
  >
    <div className="sidebar-nav-icon">{item.icon}</div>
    {(!isCollapsed || isMobileOpen) && (
      <>
        <span className="sidebar-nav-text">{item.label}</span>
        {item.badge && <span className="sidebar-nav-badge">{item.badge}</span>}
        {item.isEmergency && <span className="sidebar-emergency-indicator"></span>}
      </>
    )}
  </Link>
))

function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [theme, setTheme] = useState("light")
  const dispatch = useDispatch()

  // Optimize Redux selectors - createSelector would be better if using reselect
  const isAuthorized = useSelector((state) => state.user.isAuthorized)
  const userData = useSelector((state) => state.user.userData)
  const { username, role, avatar } = userData || {}

  // Animation on mount
  const [mounted, setMounted] = useState(false)

  // Load and apply saved theme - memoized callback
  const applyTheme = useCallback((newTheme) => {
    document.documentElement.setAttribute("data-theme", newTheme)
    document.documentElement.classList.remove("light", "dark")
    document.documentElement.classList.add(newTheme)
    localStorage.setItem("theme", newTheme)
  }, [])

  // Load theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light"
    setTheme(savedTheme)
    applyTheme(savedTheme)
    setTimeout(() => setMounted(true), 0)
  }, [applyTheme])

  // Toggle theme - memoized callback
  const toggleTheme = useCallback(() => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    applyTheme(newTheme)
  }, [theme, applyTheme])

  // Event handlers - memoized callbacks
  const toggleSidebar = useCallback(() => setIsCollapsed((prev) => !prev), [])
  const toggleMobileSidebar = useCallback(() => setIsMobileOpen((prev) => !prev), [])
  
  const handleLogout = useCallback(() => {
    dispatch(logout())
    navigate("/login")
  }, [dispatch, navigate])

  // Event listeners setup - optimized
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isMobileOpen && !e.target.closest(".sidebar") && !e.target.closest(".sidebar-mobile-toggle")) {
        setIsMobileOpen(false)
      }
    }

    const handleResize = () => {
      if (window.innerWidth > 768 && isMobileOpen) {
        setIsMobileOpen(false)
      }
    }

    document.addEventListener("click", handleClickOutside)
    window.addEventListener("resize", handleResize)

    return () => {
      document.removeEventListener("click", handleClickOutside)
      window.removeEventListener("resize", handleResize)
    }
  }, [isMobileOpen])

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [isMobileOpen])

  // Redirect to login page if not logged in
  useEffect(() => {
    if (!isAuthorized && location.pathname !== "/login") {
      navigate("/login")
    }
  }, [isAuthorized, location.pathname, navigate])

  if (!mounted) return null

  return (
    <>
      <button className="sidebar-mobile-toggle" onClick={toggleMobileSidebar} aria-label="Toggle sidebar menu">
        <Menu className="sidebar-toggle-icon" />
      </button>

      <div
        className={`sidebar-backdrop ${isMobileOpen ? "active" : ""}`}
        onClick={toggleMobileSidebar}
        aria-hidden="true"
      ></div>

      <div
        className={`sidebar ${isCollapsed ? "sidebar-collapsed" : ""} ${isMobileOpen ? "open" : ""}`}
        data-theme={theme}
      >
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo">
            <div className="sidebar-logo-icon">
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
              >
                <rect width="7" height="9" x="3" y="3" rx="1"></rect>
                <rect width="7" height="5" x="14" y="3" rx="1"></rect>
                <rect width="7" height="9" x="14" y="12" rx="1"></rect>
                <rect width="7" height="5" x="3" y="16" rx="1"></rect>
              </svg>
            </div>
            <span className="sidebar-logo-text">
              Town<span className="logo-highlight">Square</span>
            </span>
          </Link>

          <button className="sidebar-mobile-close" onClick={toggleMobileSidebar} aria-label="Close sidebar">
            <X />
          </button>
        </div>

        <button
          className="sidebar-toggle"
          onClick={toggleSidebar}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
        </button>

        <div className="sidebar-content">
          {sidebarConfig.map((section, sectionIndex) => (
            <div key={sectionIndex} className="sidebar-section">
              {!isCollapsed && <div className="sidebar-section-title">{section.section}</div>}
              <nav className="sidebar-nav">
                {section.items.map((item, itemIndex) => (
                  <SidebarItem
                    key={itemIndex}
                    item={item}
                    isActive={location.pathname === item.href}
                    isCollapsed={isCollapsed}
                    isMobileOpen={isMobileOpen}
                  />
                ))}
              </nav>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          {(!isCollapsed || isMobileOpen) && (
            <div className="theme-toggle-container">
              <ThemeToggle theme={theme} setTheme={toggleTheme} />
            </div>
          )}
          <div
            className="sidebar-user"
            onClick={() => navigate("/profile")}
            style={{ cursor: "pointer" }}
            role="button"
            tabIndex={0}
            aria-label="User profile"
          >
            {isAuthorized && (
              <img
                className="sidebar-user-avatar"
                src={avatar || "/placeholder.svg"}
                alt={username || "User avatar"}
              />
            )}
            {(!isCollapsed || isMobileOpen) && (
              <div className="sidebar-user-info">
                {isAuthorized && username && (
                  <>
                    <div className="sidebar-user-name">{username}</div>
                    <div className="sidebar-user-role">{role}</div>
                  </>
                )}
              </div>
            )}
          </div>
          {isAuthorized ? (
            <button className="sidebar-nav-item sidebar-logout" onClick={handleLogout} aria-label="Logout">
              <div className="sidebar-nav-icon">
                <LogOut />
              </div>
              {(!isCollapsed || isMobileOpen) && <span className="sidebar-nav-text">Logout</span>}
            </button>
          ) : (
            <Link to="/login" className="sidebar-nav-item sidebar-login" aria-label="Login">
              <div className="sidebar-nav-icon">
                <LogIn />
              </div>
              {(!isCollapsed || isMobileOpen) && <span className="sidebar-nav-text">Login</span>}
            </Link>
          )}
        </div>
      </div>
    </>
  )
}

export default React.memo(Sidebar)