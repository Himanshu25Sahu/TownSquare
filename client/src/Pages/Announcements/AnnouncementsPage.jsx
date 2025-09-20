import { useState, useEffect, useMemo, useCallback, memo } from "react";
import "./AnnouncementsPage.css";
import { fetchAnnouncements } from "../../Apis/postApi.jsx";
import {
  FiBell,
  FiCalendar,
  FiMapPin,
  FiChevronDown,
  FiChevronUp,
  FiAlertTriangle,
  FiShare2,
  FiClock,
  FiSearch,
  FiFilter,
  FiCheckCircle,
  FiInfo,
  FiGrid,
  FiList,
  FiX,
  FiRefreshCw,
  FiZap,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { ImageCarousel } from "../HomePage/ImageCarousel.jsx";
import { useSelector } from "react-redux";

// Memoized AnnouncementCard component to prevent unnecessary re-renders
const AnnouncementCard = memo(
  ({ announcement, onToggleDescription, viewMode, formatDate, getTimeAgo }) => {
    return (
      <motion.div
        className={`gov-announcement-card ${
          announcement.showDescription ? "expanded" : ""
        }`}
        onClick={(e) => onToggleDescription(announcement._id, e)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        whileHover={{ y: -5 }}
      >
        <div className="gov-announcement-header">
          <div className="gov-announcement-author">
            <div className="gov-announcement-avatar-container">
              <img
                className="gov-announcement-avatar"
                src={announcement.createdBy.avatar || "/default-avatar.png"}
                alt={announcement.createdBy.username}
                loading="lazy"
              />
            </div>
            <div className="gov-announcement-author-info">
              <div className="gov-announcement-name">
                {announcement.createdBy.username}
              </div>
              <div className="gov-announcement-time">
                <FiClock className="gov-time-icon" size={14} />
                {getTimeAgo(announcement.createdAt)}
              </div>
            </div>
          </div>

          <div className="gov-announcement-badges">
            {announcement.important && (
              <motion.div
                className="gov-announcement-badge important"
                whileHover={{ y: -2 }}
              >
                <FiAlertTriangle className="gov-badge-icon" size={14} />
                <span>Important</span>
              </motion.div>
            )}
            {announcement.event && (
              <motion.div
                className="gov-announcement-badge event"
                whileHover={{ y: -2 }}
              >
                <FiCalendar className="gov-badge-icon" size={14} />
                <span>Event</span>
              </motion.div>
            )}
          </div>
        </div>

        <div className="gov-announcement-content">
          <h3 className="gov-announcement-title">{announcement.title}</h3>

          <AnimatePresence>
            {announcement.showDescription && (
              <motion.div
                className="gov-announcement-details"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <p className="gov-announcement-text">
                  {announcement.description}
                </p>

                {announcement.attachments &&
                  announcement.attachments.length > 0 && (
                    <div className="gov-announcement-attachments">
                      {announcement.attachments.length === 1 ? (
                        <img
                          src={
                            announcement.attachments[0].url ||
                            "/placeholder.svg"
                          }
                          alt="Announcement attachment"
                          className="gov-announcement-attachment"
                          loading="lazy"
                        />
                      ) : (
                        <ImageCarousel
                          images={announcement.attachments.map(
                            (attachment) => attachment.url
                          )}
                        />
                      )}
                    </div>
                  )}

                {announcement.event && (
                  <div className="gov-announcement-event">
                    <div className="gov-announcement-event-header">
                      <FiCalendar className="gov-event-icon" size={18} />
                      <span>Event Details</span>
                    </div>
                    <div className="gov-announcement-event-info">
                      <div className="gov-announcement-event-date">
                        <FiCalendar className="gov-info-icon" size={16} />
                        <span>{formatDate(announcement.event.date)}</span>
                      </div>
                      {announcement.event.location && (
                        <div className="gov-announcement-event-location">
                          <FiMapPin className="gov-info-icon" size={16} />
                          <span>{announcement.event.location}</span>
                        </div>
                      )}
                    </div>
                    <div className="gov-announcement-footer">
                      <button className="gov-announcement-secondary-button">
                        <FiShare2 size={16} />
                        <span>Share</span>
                      </button>
                      <button className="gov-announcement-primary-button">
                        <FiCalendar size={16} />
                        <span>Add to Calendar</span>
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="gov-announcement-toggle">
            {announcement.showDescription ? (
              <FiChevronUp className="gov-toggle-icon" size={16} />
            ) : (
              <FiChevronDown className="gov-toggle-icon" size={16} />
            )}
            <span className="gov-toggle-text">
              {announcement.showDescription ? "Show less" : "Show more"}
            </span>
          </div>
        </div>
      </motion.div>
    );
  }
);

// Memoized Stats component
const Stats = memo(({ announcements }) => {
  const importantCount = useMemo(
    () => announcements.filter((a) => a.important).length,
    [announcements]
  );
  const eventCount = useMemo(
    () => announcements.filter((a) => a.event).length,
    [announcements]
  );

  return (
    <motion.div
      className="gov-announcements-stats"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <motion.div className="gov-stat-item" whileHover={{ y: -5 }}>
        <FiCheckCircle className="gov-stat-icon" />
        <div className="gov-stat-content">
          <span className="gov-stat-value">{announcements.length}</span>
          <span className="gov-stat-label">Announcements</span>
        </div>
      </motion.div>
      <motion.div className="gov-stat-item" whileHover={{ y: -5 }}>
        <FiAlertTriangle className="gov-stat-icon important" />
        <div className="gov-stat-content">
          <span className="gov-stat-value">{importantCount}</span>
          <span className="gov-stat-label">Important</span>
        </div>
      </motion.div>
      <motion.div className="gov-stat-item" whileHover={{ y: -5 }}>
        <FiCalendar className="gov-stat-icon event" />
        <div className="gov-stat-content">
          <span className="gov-stat-value">{eventCount}</span>
          <span className="gov-stat-label">Events</span>
        </div>
      </motion.div>
    </motion.div>
  );
});

function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState(false);
  const [filter, setFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const { token } = useSelector((state) => state.user);

  // Fetch announcements
  useEffect(() => {
    const getAnnouncements = async () => {
      setIsLoading(true);
      try {
        const data = await fetchAnnouncements(token);
        const processedData = data.map((announcement) => ({
          ...announcement,
          showDescription: false,
        }));
        setAnnouncements(processedData);
      } catch (error) {
        console.error("Failed to fetch announcements:", error);
      } finally {
        setIsLoading(false);
      }
    };
    getAnnouncements();
  }, [token]);

  // Memoized toggle function to prevent recreation on each render
  const toggleDescription = useCallback((id, event) => {
    if (event.target.closest("button")) {
      event.stopPropagation();
      return;
    }

    setAnnouncements((prevAnnouncements) =>
      prevAnnouncements.map((announcement) =>
        announcement._id === id
          ? { ...announcement, showDescription: !announcement.showDescription }
          : announcement
      )
    );
  }, []);

  // Memoized filtered announcements to prevent recalculation on every render
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((announcement) => {
      const matchesSearch =
        searchQuery === "" ||
        announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (announcement.description &&
          announcement.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()));

      if (filter === "all") return matchesSearch;
      if (filter === "important")
        return matchesSearch && announcement.important;
      if (filter === "events") return matchesSearch && announcement.event;

      return matchesSearch;
    });
  }, [announcements, searchQuery, filter]);

  // Memoized date formatters
  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const getTimeAgo = useCallback(
    (dateString) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now - date) / 1000);

      if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
      if (diffInSeconds < 3600)
        return `${Math.floor(diffInSeconds / 60)} minutes ago`;
      if (diffInSeconds < 86400)
        return `${Math.floor(diffInSeconds / 3600)} hours ago`;
      if (diffInSeconds < 604800)
        return `${Math.floor(diffInSeconds / 86400)} days ago`;

      return formatDate(dateString);
    },
    [formatDate]
  );

  // Memoized handlers for buttons
  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setFilter("all");
  }, []);

  const handleFilterChange = useCallback((newFilter) => {
    setFilter(newFilter);
    setFilterActive(false);
  }, []);

  return (
    <div className="gov-announcements-container">
      <motion.div
        className="gov-announcements-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="gov-announcements-header-text">
          <h1 className="gov-announcements-title">
            <FiZap className="gov-title-icon" />
            Government <span className="gov-gradient-text">Announcements</span>
          </h1>
          <div className="gov-title-underline"></div>
          <p className="gov-announcements-subtitle">
            Stay informed with official updates from your local government
          </p>
        </div>
        {/* <motion.button
          className="gov-announcements-subscribe-button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiBell className="gov-button-icon" />
          <span>Subscribe</span>
        </motion.button> */}
      </motion.div>

      <motion.div
        className="gov-announcements-search-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="gov-announcements-search-box">
          <FiSearch className="gov-search-icon" />
          <input
            type="text"
            placeholder="Search announcements..."
            className="gov-announcements-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <motion.button
              className="gov-search-clear-button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <FiX size={16} />
            </motion.button>
          )}
        </div>

        <div className="gov-announcements-action-buttons">
          <motion.button
            className={`gov-view-button ${viewMode === "grid" ? "active" : ""}`}
            onClick={() => setViewMode("grid")}
            aria-label="Grid view"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.9 }}
          >
            <FiGrid className="gov-view-icon" size={18} />
          </motion.button>
          <motion.button
            className={`gov-view-button ${viewMode === "list" ? "active" : ""}`}
            onClick={() => setViewMode("list")}
            aria-label="List view"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.9 }}
          >
            <FiList className="gov-view-icon" size={18} />
          </motion.button>
          <motion.button
            className={`gov-filter-button ${filterActive ? "active" : ""}`}
            onClick={() => setFilterActive(!filterActive)}
            aria-label="Filter"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.9 }}
          >
            <FiFilter className="gov-filter-icon" size={18} />
          </motion.button>
        </div>

        <AnimatePresence>
          {filterActive && (
            <motion.div
              className="gov-filter-dropdown"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="gov-filter-header">
                <h4>Filter Announcements</h4>
                <button
                  className="gov-close-filter-button"
                  onClick={() => setFilterActive(false)}
                  aria-label="Close filter"
                >
                  <FiX size={18} />
                </button>
              </div>
              <div className="gov-filter-content">
                <motion.button
                  className={`gov-filter-option ${
                    filter === "all" ? "selected" : ""
                  }`}
                  onClick={() => handleFilterChange("all")}
                  whileHover={{ x: 5 }}
                >
                  <FiEye className="gov-filter-option-icon" />
                  All Announcements
                </motion.button>
                <motion.button
                  className={`gov-filter-option ${
                    filter === "important" ? "selected" : ""
                  }`}
                  onClick={() => handleFilterChange("important")}
                  whileHover={{ x: 5 }}
                >
                  <FiAlertTriangle className="gov-filter-option-icon" />
                  Important Only
                </motion.button>
                <motion.button
                  className={`gov-filter-option ${
                    filter === "events" ? "selected" : ""
                  }`}
                  onClick={() => handleFilterChange("events")}
                  whileHover={{ x: 5 }}
                >
                  <FiCalendar className="gov-filter-option-icon" />
                  Events Only
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {isLoading ? (
        <motion.div
          className="gov-announcements-loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="gov-announcements-loader"></div>
          <p>Loading announcements...</p>
        </motion.div>
      ) : filteredAnnouncements.length === 0 ? (
        <motion.div
          className="gov-announcements-empty"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="gov-empty-icon-container">
            <FiInfo className="gov-empty-icon" />
          </div>
          <h3>No announcements found</h3>
          <p>Try adjusting your search or filter criteria</p>
          <motion.button
            className="gov-clear-search-button"
            onClick={handleClearSearch}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiRefreshCw size={16} className="gov-button-icon" />
            Reset Filters
          </motion.button>
        </motion.div>
      ) : (
        <motion.div
          className={`gov-announcements-list ${
            viewMode === "grid" ? "grid-view" : "list-view"
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {filteredAnnouncements.map((announcement, index) => (
            <AnnouncementCard
              key={announcement._id}
              announcement={announcement}
              onToggleDescription={toggleDescription}
              viewMode={viewMode}
              formatDate={formatDate}
              getTimeAgo={getTimeAgo}
            />
          ))}
        </motion.div>
      )}

      <motion.div
        className="gov-announcements-footer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Stats announcements={announcements} />
      </motion.div>
    </div>
  );
}

export default AnnouncementsPage;
