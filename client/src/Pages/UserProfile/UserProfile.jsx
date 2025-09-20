
import { useState, useEffect, createContext, useContext } from "react"
import { UserProfileContent } from "./UserProfileContent.jsx"
import { CheckCircle, X, AlertTriangle, Bell } from "lucide-react"
import "./UserProfile.css"
import "./EditProfile.css"

// Toast Context
const ToastContext = createContext(null)

// Toast Provider Component
const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = (message, type = "success", duration = 3000) => {
    const id = Date.now()
    const newToast = { id, message, type, duration }
    setToasts((prev) => [...prev, newToast])

    setTimeout(() => {
      removeToast(id)
    }, duration)

    return id
  }

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="neo-toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`neo-toast neo-toast-${toast.type}`} onClick={() => removeToast(toast.id)}>
            {toast.type === "success" && <CheckCircle size={18} />}
            {toast.type === "error" && <AlertTriangle size={18} />}
            {toast.type === "info" && <Bell size={18} />}
            <span>{toast.message}</span>
            <button className="neo-toast-close" onClick={() => removeToast(toast.id)}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// Hook to use toast
export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

// Parent component handling loading state and ToastProvider
const UserProfile = () => {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="neo-profile-loading">
        <div className="neo-loading-spinner"></div>
        <div className="neo-loading-text">Loading your neural profile...</div>
      </div>
    )
  }

  return (
    <ToastProvider>
      <UserProfileContent />
    </ToastProvider>
  )
}

export default UserProfile
