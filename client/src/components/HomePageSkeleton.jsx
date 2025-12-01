
const PulseLoader = ({ size = 'medium' }) => {
  const sizeMap = {
    small: '24px',
    medium: '40px',
    large: '64px'
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      padding: '40px'
    }}>
      <div style={{
        width: sizeMap[size],
        height: sizeMap[size],
        borderRadius: '50%',
        background: 'var(--pulse-loader-color, #3b82f6)',
        animation: 'pulse-animation 1.5s ease-in-out infinite'
      }} />
      <style>{`
        @keyframes pulse-animation {
          0%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
        }

        /* Light mode */
        :root {
          --pulse-loader-color: #3b82f6;
        }

        /* Dark mode */
        @media (prefers-color-scheme: dark) {
          :root {
            --pulse-loader-color: #60a5fa;
          }
        }

        /* Manual dark mode class support */
        .dark {
          --pulse-loader-color: #60a5fa;
        }

        [data-theme="dark"] {
          --pulse-loader-color: #60a5fa;
        }
      `}</style>
    </div>
  );
};

const TownsquareSkeleton = () => {
  return (
    <div className="ts-skeleton-container">
      {/* Header Skeleton */}
      {/* Hero Carousel Skeleton */}
      <div className="ts-skeleton-carousel"></div>

      {/* Quick Links Skeleton */}
      <div className="ts-skeleton-quick-links">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="ts-skeleton-quick-link"></div>
        ))}
      </div>

      {/* Pulse Loader */}
      <PulseLoader size="medium" />

      {/* Main Content Grid */}
      <div className="ts-skeleton-content-grid">
        {/* Main Feed Skeleton */}
        <main className="ts-skeleton-main-feed">
          <div className="ts-skeleton-section-header"></div>

          {/* Post Cards Skeleton */}
          <div className="ts-skeleton-posts-container">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="ts-skeleton-post-card">
                <div className="ts-skeleton-post-header">
                  <div className="ts-skeleton-avatar"></div>
                  <div className="ts-skeleton-post-meta">
                    <div className="ts-skeleton-author-name"></div>
                    <div className="ts-skeleton-post-time"></div>
                  </div>
                </div>
                <div className="ts-skeleton-post-content">
                  <div className="ts-skeleton-post-title"></div>
                  <div className="ts-skeleton-post-text"></div>
                  <div className="ts-skeleton-post-text"></div>
                </div>
                <div className="ts-skeleton-post-image"></div>
                <div className="ts-skeleton-post-actions">
                  <div className="ts-skeleton-action-button"></div>
                  <div className="ts-skeleton-action-button"></div>
                  <div className="ts-skeleton-action-button"></div>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Sidebar Skeleton */}
        <aside className="ts-skeleton-sidebar">
          {/* Trending Section */}
          <div className="ts-skeleton-sidebar-section">
            <div className="ts-skeleton-section-header"></div>
            <div className="ts-skeleton-section-content">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="ts-skeleton-trending-item">
                  <div className="ts-skeleton-trending-title"></div>
                  <div className="ts-skeleton-trending-meta"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Events Section */}
          <div className="ts-skeleton-sidebar-section">
            <div className="ts-skeleton-section-header"></div>
            <div className="ts-skeleton-section-content">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="ts-skeleton-event-item">
                  <div className="ts-skeleton-event-title"></div>
                  <div className="ts-skeleton-event-meta"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Alert Card Skeleton */}
          <div className="ts-skeleton-alert-card">
            <div className="ts-skeleton-alert-icon"></div>
            <div className="ts-skeleton-alert-content">
              <div className="ts-skeleton-alert-title"></div>
              <div className="ts-skeleton-alert-text"></div>
            </div>
          </div>

          {/* Stats Card Skeleton */}
          <div className="ts-skeleton-stats-card">
            <div className="ts-skeleton-stats-header"></div>
            <div className="ts-skeleton-stats-content">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="ts-skeleton-stat-item">
                  <div className="ts-skeleton-stat-icon"></div>
                  <div className="ts-skeleton-stat-info">
                    <div className="ts-skeleton-stat-value"></div>
                    <div className="ts-skeleton-stat-label"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Support Card Skeleton */}
          <div className="ts-skeleton-support-card">
            <div className="ts-skeleton-support-icon"></div>
            <div className="ts-skeleton-support-content">
              <div className="ts-skeleton-support-title"></div>
              <div className="ts-skeleton-support-text"></div>
              <div className="ts-skeleton-support-button"></div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default TownsquareSkeleton