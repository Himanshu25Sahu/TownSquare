"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Search,
  Filter,
  MapPin,
  Tag,
  ChevronLeft,
  ChevronRight,
  Share2,
  MessageCircle,
  AlertTriangle,
  RefreshCw,
  ShoppingBag,
  Gift,
  Bookmark,
  Clock,
  DollarSign,
  Star,
  Grid,
  List,
  ArrowUpDown,
  User,
  TrendingUp,
  Award,
  ThumbsUp,
  HelpCircle,
} from "lucide-react";
import "./MarketplacePage.css";

export const ImageCarousel = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const handlePrev = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 100) {
      handleNext();
    }
    if (touchEnd - touchStart > 100) {
      handlePrev();
    }
  };

  return (
    <div className="image-carousel">
      <div
        className="carousel-container"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={`carousel-track ${isTransitioning ? "transitioning" : ""}`}
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((image, index) => (
            <div key={index} className="carousel-slide">
              <img
                src={image || "/placeholder.svg?height=300&width=400"}
                alt={`Image ${index + 1}`}
                className="carousel-image"
              />
            </div>
          ))}
        </div>

        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="carousel-button carousel-button-prev"
              aria-label="Previous image"
            >
              <ChevronLeft className="carousel-icon" />
            </button>
            <button
              onClick={handleNext}
              className="carousel-button carousel-button-next"
              aria-label="Next image"
            >
              <ChevronRight className="carousel-icon" />
            </button>
            <div className="carousel-indicators">
              {images.map((_, index) => (
                <div
                  key={index}
                  className={`carousel-indicator ${index === currentIndex ? "active" : ""}`}
                  onClick={() => setCurrentIndex(index)}
                  role="button"
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const MarketplaceItem = ({ item, onContact, onSave }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [message, setMessage] = useState("");

  const toggleSave = (e) => {
    e.stopPropagation();
    setIsSaved(!isSaved);
    onSave(item);
  };

  const toggleContact = (e) => {
    e.stopPropagation();
    setShowContact(!showContact);
  };

  const handleShare = (e) => {
    e.stopPropagation();
    alert("Sharing options coming soon!");
  };

  const handleSendMessage = () => {
    if (!message.trim()) {
      alert("Please enter a message.");
      return;
    }
    onContact(item.id, message);
    setShowContact(false);
    setMessage("");
  };

  const getStatusBadge = () => {
    switch (item.itemType) {
      case "sale":
        return (
          <div className="item-badge sale">
            <DollarSign className="badge-icon" />
            For Sale
          </div>
        );
      case "free":
        return (
          <div className="item-badge free">
            <Gift className="badge-icon" />
            Free
          </div>
        );
      case "wanted":
        return (
          <div className="item-badge wanted">
            <ShoppingBag className="badge-icon" />
            Wanted
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`marketplace-item ${isHovered ? "hovered" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="marketplace-item-header">
        <div className="item-title-container">
          <h3 className="item-title">{item.title}</h3>
          <div className="item-meta">
            <span className="item-date">
              <Clock className="meta-icon" />
              {new Date(item.createdAt).toLocaleDateString()}
            </span>
            <span className="item-seller">
              <User className="meta-icon" />
              {item.seller.username}
            </span>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      <div className="marketplace-item-images">
        <ImageCarousel images={item.images} />
        <div className="item-quick-actions">
          <button
            className={`quick-action-button ${isSaved ? "active" : ""}`}
            onClick={toggleSave}
            aria-label={isSaved ? "Unsave item" : "Save item"}
          >
            <Bookmark className="quick-action-icon" />
          </button>
          <button
            className="quick-action-button"
            onClick={handleShare}
            aria-label="Share item"
          >
            <Share2 className="quick-action-icon" />
          </button>
          <button
            className="quick-action-button"
            onClick={toggleContact}
            aria-label="Contact seller"
          >
            <MessageCircle className="quick-action-icon" />
          </button>
        </div>
      </div>

      <div className="marketplace-item-content">
        <div className="item-price-location">
          {item.itemType === "sale" && (
            <div className="item-price">
              <DollarSign className="price-icon" />
              <span className="price-value">${item.price.toFixed(2)}</span>
            </div>
          )}
          <div className="item-location">
            <MapPin className="location-icon" />
            {item.location}
          </div>
        </div>

        <div className="item-description">
          <p>{item.description}</p>
        </div>

        {item.tags && item.tags.length > 0 && (
          <div className="item-tags">
            <Tag className="tags-icon" />
            <div className="tags-list">
              {item.tags.map((tag, index) => (
                <span key={index} className="item-tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="marketplace-item-footer">
        <button
          className="contact-button"
          onClick={toggleContact}
          aria-label={`Contact ${item.itemType === "wanted" ? "buyer" : "seller"}`}
        >
          <MessageCircle className="button-icon" />
          Contact {item.itemType === "wanted" ? "Buyer" : "Seller"}
        </button>
      </div>

      {showContact && (
        <div className="contact-overlay">
          <div className="contact-card">
            <div className="contact-header">
              <h4>Contact {item.seller.username}</h4>
              <button
                className="close-button"
                onClick={toggleContact}
                aria-label="Close contact form"
              >
                ×
              </button>
            </div>
            <div className="contact-content">
              <div className="contact-info">
                <div className="contact-avatar">
                  {item.seller.username.charAt(0)}
                </div>
                <div className="contact-details">
                  <div className="contact-name">{item.seller.username}</div>
                  <div className="contact-rating">
                    <Star className="rating-icon filled" />
                    <Star className="rating-icon filled" />
                    <Star className="rating-icon filled" />
                    <Star className="rating-icon filled" />
                    <Star className="rating-icon" />
                    <span className="rating-text">4.0</span>
                  </div>
                </div>
              </div>
              <textarea
                className="contact-message"
                placeholder="Write your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                aria-label="Message to seller"
              />
              <button
                className="send-message-button"
                onClick={handleSendMessage}
                aria-label="Send message"
              >
                <MessageCircle className="button-icon" />
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function Marketplace() {
  const { token } = useSelector((state) => state.user);
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabTransitioning, setTabTransitioning] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    location: "",
    condition: "all",
  });
  const [sortOption, setSortOption] = useState("newest");
  const [theme, setTheme] = useState("light");

  // Load and apply saved theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
    document.documentElement.classList.add(savedTheme);
  }, []);

  // Fetch marketplace posts
  useEffect(() => {
    const fetchMarketplacePosts = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_BASEURL}/post/marketplacePosts`,
          {
            credentials: "include", // Include cookies in the request
            headers: {
              Authorization: `Bearer ${token}`, // Include token if required by backend
            },
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch marketplace posts");
        }
        const data = await response.json();
        setItems(data.data || []); // Ensure items is an array
        setError(null);
      } catch (error) {
        setError(error.message || "Failed to fetch marketplace posts");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchMarketplacePosts();
    } else {
      setError("Please log in to view marketplace posts");
      setLoading(false);
    }
  }, [token]);

  const handleContact = async (postId, message) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_BASEURL}/post/marketplacePosts/${postId}/message`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Include token if required
          },
          credentials: "include",
          body: JSON.stringify({ message }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();
      alert(data.message || "Message sent successfully!");
    } catch (error) {
      alert("Error sending message: " + (error.message || "Unknown error"));
    }
  };

  const handleSave = (item) => {
    console.log("Item saved:", item);
    // Implement save functionality (e.g., API call to save item)
  };

  const handleTabChange = (tab) => {
    if (tab === activeTab || tabTransitioning) return;

    setTabTransitioning(true);
    setTimeout(() => {
      setActiveTab(tab);
      setTabTransitioning(false);
    }, 300);
  };

  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
    if (isSortOpen) setIsSortOpen(false);
  };

  const toggleSort = () => {
    setIsSortOpen(!isSortOpen);
    if (isFilterOpen) setIsFilterOpen(false);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const applyFilters = () => {
    setIsFilterOpen(false);
    alert("Filters applied successfully!");
  };

  const handleSortChange = (option) => {
    setSortOption(option);
    setIsSortOpen(false);
  };

  const getFilteredItems = () => {
    let filtered = [...items];

    if (activeTab !== "all") {
      filtered = filtered.filter((item) => item.itemType === activeTab);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.location.toLowerCase().includes(query)
      );
    }

    if (filters.minPrice) {
      filtered = filtered.filter(
        (item) => item.price >= Number.parseFloat(filters.minPrice)
      );
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(
        (item) => item.price <= Number.parseFloat(filters.maxPrice)
      );
    }

    if (filters.location) {
      filtered = filtered.filter((item) =>
        item.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    switch (sortOption) {
      case "newest":
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case "priceAsc":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "priceDesc":
        filtered.sort((a, b) => b.price - a.price);
        break;
      default:
        break;
    }

    return filtered;
  };

  const filteredItems = getFilteredItems();

  if (loading) {
    return (
      <div className="marketplace-loading">
        <div className="marketplace-loading-spinner"></div>
        <p>Loading marketplace items...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="marketplace-error">
        <AlertTriangle className="error-icon" />
        <h3 className="marketplace-error-title">Error Loading Marketplace</h3>
        <p className="marketplace-error-message">{error}</p>
        <button
          className="marketplace-error-button"
          onClick={() => window.location.reload()}
          aria-label="Try again"
        >
          <RefreshCw className="button-icon" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="marketplace-container">
      <div className="marketplace-header">
        <h1 className="marketplace-title">
          Community <span className="gradient-text">Marketplace</span>
        </h1>
        <p className="marketplace-subtitle">
          Buy, sell, and trade with your neighbors
        </p>
        <div className="marketplace-search-container">
          <div className="marketplace-search-box">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search for items..."
              className="marketplace-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search marketplace items"
            />
            {searchQuery && (
              <button
                className="search-clear-button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
          <div className="marketplace-action-buttons">
            <button
              className={`filter-button ${isFilterOpen ? "active" : ""}`}
              onClick={toggleFilter}
              aria-label="Filter options"
            >
              <Filter className="filter-icon" />
            </button>
            <button
              className={`sort-button ${isSortOpen ? "active" : ""}`}
              onClick={toggleSort}
              aria-label="Sort options"
            >
              <ArrowUpDown className="sort-icon" />
            </button>
            <button
              className={`view-button ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
            >
              <Grid className="view-icon" />
            </button>
            <button
              className={`view-button ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
              aria-label="List view"
            >
              <List className="view-icon" />
            </button>
          </div>
        </div>

        {isFilterOpen && (
          <div className="filter-dropdown">
            <div className="filter-header">
              <h3>Filter Items</h3>
              <button
                className="close-filter-button"
                onClick={() => setIsFilterOpen(false)}
                aria-label="Close filter options"
              >
                ×
              </button>
            </div>
            <div className="filter-content">
              <div className="filter-group">
                <label htmlFor="minPrice">Min Price</label>
                <input
                  type="number"
                  id="minPrice"
                  name="minPrice"
                  placeholder="Min $"
                  value={filters.minPrice}
                  onChange={handleFilterChange}
                  className="filter-input"
                  aria-label="Minimum price"
                />
              </div>
              <div className="filter-group">
                <label htmlFor="maxPrice">Max Price</label>
                <input
                  type="number"
                  id="maxPrice"
                  name="maxPrice"
                  placeholder="Max $"
                  value={filters.maxPrice}
                  onChange={handleFilterChange}
                  className="filter-input"
                  aria-label="Maximum price"
                />
              </div>
              <div className="filter-group">
                <label htmlFor="location">Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  placeholder="Enter location"
                  value={filters.location}
                  onChange={handleFilterChange}
                  className="filter-input"
                  aria-label="Location"
                />
              </div>
              <div className="filter-group">
                <label htmlFor="condition">Condition</label>
                <select
                  id="condition"
                  name="condition"
                  value={filters.condition}
                  onChange={handleFilterChange}
                  className="filter-select"
                  aria-label="Item condition"
                >
                  <option value="all">All Conditions</option>
                  <option value="new">New</option>
                  <option value="likeNew">Like New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
              <button
                className="apply-filters-button"
                onClick={applyFilters}
                aria-label="Apply filters"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {isSortOpen && (
          <div className="sort-dropdown">
            <div className="sort-header">
              <h3>Sort By</h3>
              <button
                className="close-sort-button"
                onClick={() => setIsSortOpen(false)}
                aria-label="Close sort options"
              >
                ×
              </button>
            </div>
            <div className="sort-options">
              <button
                className={`sort-option ${sortOption === "newest" ? "active" : ""}`}
                onClick={() => handleSortChange("newest")}
                aria-label="Sort by newest first"
              >
                <Clock className="sort-option-icon" />
                Newest First
              </button>
              <button
                className={`sort-option ${sortOption === "oldest" ? "active" : ""}`}
                onClick={() => handleSortChange("oldest")}
                aria-label="Sort by oldest first"
              >
                <Clock className="sort-option-icon" />
                Oldest First
              </button>
              <button
                className={`sort-option ${sortOption === "priceAsc" ? "active" : ""}`}
                onClick={() => handleSortChange("priceAsc")}
                aria-label="Sort by price low to high"
              >
                <DollarSign className="sort-option-icon" />
                Price: Low to High
              </button>
              <button
                className={`sort-option ${sortOption === "priceDesc" ? "active" : ""}`}
                onClick={() => handleSortChange("priceDesc")}
                aria-label="Sort by price high to low"
              >
                <DollarSign className="sort-option-icon" />
                Price: High to Low
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="marketplace-tabs">
        <div className="marketplace-tabs-list">
          <button
            className={`marketplace-tab ${activeTab === "all" ? "active" : ""}`}
            onClick={() => handleTabChange("all")}
            aria-label="View all items"
          >
            <ShoppingBag className="tab-icon" />
            All Items
          </button>
          <button
            className={`marketplace-tab ${activeTab === "sale" ? "active" : ""}`}
            onClick={() => handleTabChange("sale")}
            aria-label="View items for sale"
          >
            <DollarSign className="tab-icon" />
            For Sale
          </button>
          <button
            className={`marketplace-tab ${activeTab === "free" ? "active" : ""}`}
            onClick={() => handleTabChange("free")}
            aria-label="View free items"
          >
            <Gift className="tab-icon" />
            Free
          </button>
          <button
            className={`marketplace-tab ${activeTab === "wanted" ? "active" : ""}`}
            onClick={() => handleTabChange("wanted")}
            aria-label="View wanted items"
          >
            <Search className="tab-icon" />
            Wanted
          </button>
        </div>

        <div
          className={`marketplace-tab-content ${tabTransitioning ? "tab-transitioning" : ""}`}
        >
          {filteredItems.length > 0 ? (
            <div
              className={`marketplace-items ${viewMode === "list" ? "list-view" : "grid-view"}`}
            >
              {filteredItems.map((item) => (
                <MarketplaceItem
                  key={item.id}
                  item={item}
                  onContact={handleContact}
                  onSave={handleSave}
                />
              ))}
            </div>
          ) : (
            <div className="marketplace-empty">
              <div className="empty-icon-container">
                <ShoppingBag className="empty-icon" />
              </div>
              <p>
                No {activeTab !== "all" ? activeTab : ""} items{" "}
                {searchQuery ? "matching your search" : "at the moment"}.
              </p>
              {searchQuery && (
                <button
                  className="clear-search-button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search query"
                >
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="marketplace-footer">
        <div className="marketplace-stats">
          <div className="stat-item">
            <TrendingUp className="stat-icon" />
            <div className="stat-content">
              <span className="stat-value">{items.length}</span>
              <span className="stat-label">Total Items</span>
            </div>
          </div>
          <div className="stat-item">
            <Award className="stat-icon" />
            <div className="stat-content">
              <span className="stat-value">
                {items.filter((item) => item.itemType === "sale").length}
              </span>
              <span className="stat-label">For Sale</span>
            </div>
          </div>
          <div className="stat-item">
            <ThumbsUp className="stat-icon" />
            <div className="stat-content">
              <span className="stat-value">98%</span>
              <span className="stat-label">Satisfaction Rate</span>
            </div>
          </div>
        </div>

        <div className="marketplace-help">
          <HelpCircle className="help-icon" />
          <p>
            Need help listing an item?{" "}
            <a href="#" className="help-link">
              Check our guide
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}