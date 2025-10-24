import { useState, useEffect } from "react"
import { Vote, ChevronLeft, ChevronRight, Send } from "lucide-react"

export const ImageCarousel = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handleNext = (e) => {
    e?.stopPropagation()
    if (isTransitioning || !images || images.length <= 1) return
    setIsTransitioning(true)
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
    setTimeout(() => setIsTransitioning(false), 500)
  }

  const handlePrev = (e) => {
    e?.stopPropagation()
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

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 100) {
      handleNext()
    }
    if (touchEnd - touchStart > 100) {
      handlePrev()
    }
  }

  if (!images || images.length === 0) {
    return null
  }

  return (
    <div className="neo-image-carousel">
      <div
        className="neo-carousel-container"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={`neo-carousel-track ${isTransitioning ? "transitioning" : ""}`}
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((image, index) => (
            <div key={`image-slide-${index}`} className="neo-carousel-slide">
              <img
                src={image.url || "/placeholder.svg?height=400&width=600"}
                alt={`Image ${index + 1}`}
                className="neo-carousel-image"
                loading={index === 0 ? "eager" : "lazy"}
                width="600"
                height="400"
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
              className="neo-carousel-button neo-carousel-button-prev"
              aria-label="Previous image"
            >
              <ChevronLeft className="neo-carousel-icon" />
            </button>
            <button
              onClick={(e) => {
                handleNext(e)
                e.stopPropagation()
              }}
              className="neo-carousel-button neo-carousel-button-next"
              aria-label="Next image"
            >
              <ChevronRight className="neo-carousel-icon" />
            </button>
            <div className="neo-carousel-indicators">
              {images.map((_, index) => (
                <button
                  key={`indicator-${index}`}
                  className={`neo-carousel-indicator ${index === currentIndex ? "active" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setCurrentIndex(index)
                  }}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}