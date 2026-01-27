import { useState } from "react"

export const ImageCarousel = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handleNext = (e) => {
    e.stopPropagation()
    if (isTransitioning || !images || images.length <= 1) return
    setIsTransitioning(true)
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
    setTimeout(() => setIsTransitioning(false), 500)
  }

  const handlePrev = (e) => {
    e.stopPropagation()
    if (isTransitioning || !images || images.length <= 1) return
    setIsTransitioning(true)
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length)
    setTimeout(() => setIsTransitioning(false), 500)
  }

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = (e) => {
    if (touchStart - touchEnd > 100) {
      handleNext(e)
    }
    if (touchEnd - touchStart > 100) {
      handlePrev(e)
    }
  }

  if (!images || images.length === 0) {
    return null
  }

  return (
    <div className="ts-image-carousel">
      <div
        className="ts-carousel-container"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={`ts-carousel-track ${isTransitioning ? "transitioning" : ""}`}
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((image, index) => (
            <div key={`image-slide-${index}`} className="ts-carousel-slide">
              <img
                src={image.url || "/placeholder.svg?height=300&width=400"}
                alt={`Image ${index + 1}`}
                className="ts-carousel-image"
                loading={index === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>

        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                handlePrev(e)
                e.stopPropagation()
              }}
              className="ts-carousel-button ts-carousel-button-prev"
              aria-label="Previous image"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ts-carousel-icon"
              >
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <button
              onClick={(e) => {
                handleNext(e)
                e.stopPropagation()
              }}
              className="ts-carousel-button ts-carousel-button-next"
              aria-label="Next image"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ts-carousel-icon"
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
            <div className="ts-carousel-indicators">
              {images.map((_, index) => (
                <div
                  key={`indicator-${index}`}
                  className={`ts-carousel-indicator ${index === currentIndex ? "active" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setCurrentIndex(index)
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}