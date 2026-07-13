import React, { useState, useEffect, useRef } from "react";
import { SliderItem } from "../types";
import { ChevronLeft, ChevronRight, BookOpen, ExternalLink, ClipboardList, Sparkles } from "lucide-react";

interface VisitorSliderProps {
  slides: SliderItem[];
  visitorName?: string;
  onOpenVisitorForm?: () => void;
}

export function VisitorSlider({ slides, visitorName, onOpenVisitorForm }: VisitorSliderProps) {
  const activeSlides = slides.filter(s => s.isActive);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Reset index if slides change or index is out of bounds
    if (currentIndex >= activeSlides.length) {
      setCurrentIndex(0);
    }
  }, [activeSlides, currentIndex]);

  useEffect(() => {
    if (activeSlides.length <= 1 || isHovered) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentIndex(prevIndex => (prevIndex + 1) % activeSlides.length);
    }, 6000); // 6 seconds interval

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeSlides, isHovered]);

  if (activeSlides.length === 0) {
    return null;
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prevIndex => (prevIndex - 1 + activeSlides.length) % activeSlides.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prevIndex => (prevIndex + 1) % activeSlides.length);
  };

  const handleDotClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(index);
  };

  const currentSlide = activeSlides[currentIndex];

  const handleSlideClick = () => {
    if (currentSlide.linkUrl) {
      window.open(currentSlide.linkUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div 
      id="visitor-home-slider"
      className="relative w-full bg-gray-900 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg h-[180px] sm:h-[350px] mb-6 sm:mb-8 group select-none border border-gray-800"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Slides view wrapper */}
      <div 
        onClick={handleSlideClick}
        className={`w-full h-full relative transition-all ${
          currentSlide.linkUrl ? "cursor-pointer" : ""
        }`}
      >
        {/* Carousel Elements (Images or Gradients) - Smooth Crossfade */}
        {activeSlides.map((slide, idx) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            {slide.isGradientBg ? (
              /* Gradient Background rendering */
              <div className={`w-full h-full bg-gradient-to-r ${slide.gradientClass || "from-indigo-600 via-indigo-500 to-purple-600"}`} />
            ) : (
              /* Image background rendering */
              <img
                src={slide.imageUrl}
                alt={slide.title || "Banner Perpustakaan"}
                className="w-full h-full object-cover object-center transform scale-100 hover:scale-105 transition-transform duration-10000"
                loading="lazy"
              />
            )}
            {/* Dynamic Vignette overlay (only shown for non-gradients or text overlays) */}
            {(!slide.isGradientBg || !slide.hideOverlayText) && (
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-black/10" />
            )}
          </div>
        ))}

        {/* Content Overlay (Blended style, not card-contained) */}
        {!currentSlide.hideOverlayText && (
          <div className="absolute inset-x-0 bottom-0 z-20 p-3.5 sm:p-10 pb-5 sm:pb-10 flex flex-col justify-end text-white text-left pointer-events-none">
            <div className="max-w-[95%] sm:max-w-2xl mr-0 sm:mr-12 transform transition-all duration-500 pointer-events-auto">
              
              {/* Badge for gradient welcome slide */}
              {currentSlide.isGradientBg && (
                <div className="flex items-center gap-1 bg-white/10 w-fit px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-xs font-semibold tracking-wide backdrop-blur-sm mb-1.5 sm:mb-3 shadow-sm border border-white/15">
                  <Sparkles className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-yellow-300" />
                  <span>Pustaka Digital Terbuka</span>
                </div>
              )}

              {(currentSlide.title || visitorName) && (
                <h2 className="text-sm sm:text-3xl font-black tracking-tight mb-1 sm:mb-3 text-white flex items-center gap-1.5 sm:gap-2.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-tight sm:leading-snug">
                  <BookOpen className="w-3.5 h-3.5 sm:w-6 sm:h-6 text-indigo-400 flex-shrink-0 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]" />
                  <span>
                    {currentSlide.id === "default-welcome" && visitorName 
                      ? `Halo, ${visitorName}! Selamat datang` 
                      : (currentSlide.title || "Selamat datang")}
                  </span>
                </h2>
              )}

              {currentSlide.description && (
                <p className="text-[10px] sm:text-base text-gray-100 leading-normal sm:leading-relaxed drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.8)] max-w-xl font-medium line-clamp-2 sm:line-clamp-none">
                  {currentSlide.description}
                </p>
              )}

              {/* Display Visitor Form Log Button on the invitation gradient slide if unregistered */}
              {currentSlide.id === "default-invitation" && !visitorName && onOpenVisitorForm && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenVisitorForm();
                  }}
                  className="mt-2.5 sm:mt-4 inline-flex items-center gap-1 px-3 py-1.5 sm:px-5 sm:py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 font-bold rounded-lg sm:rounded-xl text-[9px] sm:text-sm shadow-lg shadow-black/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <ClipboardList className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-600" />
                  <span>Isi Form Kunjungan</span>
                </button>
              )}

              {currentSlide.linkUrl && (
                <div className="inline-flex items-center gap-1 mt-2 sm:mt-3 text-[9px] sm:text-xs font-bold text-indigo-300 hover:text-indigo-200 transition-colors drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  <span>Pelajari Selengkapnya</span>
                  <ExternalLink className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Arrows */}
      {activeSlides.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="hidden sm:block absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 p-1.5 sm:p-2.5 rounded-full bg-black/45 hover:bg-indigo-600/95 text-white border border-white/10 shadow-lg opacity-80 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-all duration-300 scale-95 hover:scale-105 active:scale-95"
            aria-label="Slide sebelumnya"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="hidden sm:block absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 p-1.5 sm:p-2.5 rounded-full bg-black/45 hover:bg-indigo-600/95 text-white border border-white/10 shadow-lg opacity-80 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-all duration-300 scale-95 hover:scale-105 active:scale-95"
            aria-label="Slide berikutnya"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </>
      )}

      {/* Pagination Dot Indicators */}
      {activeSlides.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 sm:bottom-auto sm:left-auto sm:-translate-x-0 sm:right-6 sm:top-6 z-30 flex gap-1.5 bg-black/40 backdrop-blur-sm px-2.5 py-1 sm:py-1.5 rounded-full border border-white/10">
          {activeSlides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => handleDotClick(idx, e)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex ? "w-4 bg-indigo-500" : "w-1.5 bg-white/45 hover:bg-white/70"
              }`}
              aria-label={`Buka slide ke-${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
