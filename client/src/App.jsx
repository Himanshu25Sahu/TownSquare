import { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider.jsx";
import Layout from "./components/Layout.jsx";
import "./App.css";
import axios from "axios";
import { Toaster } from "react-hot-toast";
import { useSelector } from "react-redux";
import SurveysPage from "./Pages/SurveyPage/SurveysPage.jsx";
import PostPage from './Pages/PostPage/PostPage.jsx';

// Configure axios
axios.defaults.withCredentials = true;

// Error Boundary Component
function ErrorBoundary({ children }) {
  const [hasError, setHasError] = useState(false);

  const resetError = () => {
    setHasError(false);
    window.location.reload();
  };

  useEffect(() => {
    const errorHandler = () => setHasError(true);
    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  if (hasError) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
            Component Failed to Load
          </h2>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            onClick={resetError}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return children;
}

// Optimized Loading Component
const Loading = () => (
  <div className="fixed inset-0 flex justify-center items-center bg-white dark:bg-gray-900">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

// Safe Lazy Load Wrapper
function lazyWithRetry(factory) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (error) {
      console.error('Lazy loading failed:', error);
      // Return a component that shows error and allows retry
      return {
        default: () => (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="mb-4 text-red-500">Failed to load component</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Retry
            </button>
          </div>
        )
      };
    }
  });
}

// Lazy-loaded components with proper error handling
const HomePage = lazyWithRetry(() => import("./Pages/HomePage/HomePage.jsx"));
const DiscussionsPage = lazyWithRetry(() => import("./Pages/Discussions/DiscussionsPage.jsx"));
const AnnouncementsPage = lazyWithRetry(() => import("./Pages/Announcements/AnnouncementsPage.jsx"));
const UserProfile = lazyWithRetry(() => import("./Pages/UserProfile/UserProfile.jsx"));
const EmergencyPage = lazyWithRetry(() => import("./Pages/Emergency/EmergencyPage.jsx"));
const MarketplacePage = lazyWithRetry(() => import("./Pages/MarketPlace/MarketplacePage.jsx"));
const AuthPage = lazyWithRetry(() => import("./components/Login.jsx"));
const CreatePost = lazyWithRetry(() => import("./components/CreatePost.jsx"));
const Verify = lazyWithRetry(() => import("./Pages/Verification/Verify.jsx"));

// Main App Component
function App() {
  const { userData } = useSelector((state) => state.user);

  return (
    <ThemeProvider>
      <Router>
        <Layout>
          <div className="main-cont-app">
            <Toaster 
              position="bottom-right" 
              toastOptions={{ 
                duration: 2000,
                className: 'dark:bg-gray-800 dark:text-white'
              }} 
            />
            <ErrorBoundary>
              <Routes>
                <Route 
                  path="/login" 
                  element={
                    <Suspense fallback={<Loading />}>
                      <AuthPage />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/verify" 
                  element={
                    <Suspense fallback={<Loading />}>
                      <Verify />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/" 
                  element={
                    <Suspense fallback={<Loading />}>
                      <HomePage />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/discussions" 
                  element={
                    <Suspense fallback={<Loading />}>
                      <DiscussionsPage />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/announcements" 
                  element={
                    <Suspense fallback={<Loading />}>
                      <AnnouncementsPage />
                    </Suspense>
                  } 
                />
                <Route path="/surveys" element={<SurveysPage />} />
                <Route 
                  path="/marketplace" 
                  element={
                    <Suspense fallback={<Loading />}>
                      <MarketplacePage />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/emergency" 
                  element={
                    <Suspense fallback={<Loading />}>
                      <EmergencyPage />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/createPost" 
                  element={
                    <Suspense fallback={<Loading />}>
                      <CreatePost />
                    </Suspense>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <Suspense fallback={<Loading />}>
                      <UserProfile />
                    </Suspense>
                  } 
                />
                <Route path="/post/:id" element={<PostPage />} />
              </Routes>
            </ErrorBoundary>
          </div>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;