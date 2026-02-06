import { useState, useEffect, useRef } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';


const slides = [
  {
    image: '/images/hero-1.jpg',
    title: 'Evara',
    subtitle: 'The Style Studio',
    description: 'Discover the latest trends in fashion, jewelry, and beauty',
    cta: 'Explore Collection',
    category: 'dress' as const,
  },
  {
    image: '/images/hero-2.jpg',
    title: 'New Arrivals',
    subtitle: 'Spring Collection 2026',
    description: 'Elevate your style with our exclusive new collection',
    cta: 'Shop Now',
    category: 'jewelry' as const,
  },
];

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const nextSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsAnimating(false), 800);
  };

  const prevSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsAnimating(false), 800);
  };

  useEffect(() => {
    intervalRef.current = setInterval(nextSlide, 6000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleCTAClick = () => {
    // Only scroll to products section without changing category filter
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Background Slides */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-all duration-1000 ease-out ${index === currentSlide
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-105'
            }`}
        >
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover"
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 h-full flex items-center section-padding">
        <div className="max-w-3xl">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`${index === currentSlide ? 'block' : 'hidden'}`}
            >
              {/* Subtitle */}
              <p
                className={`text-gold-400 text-sm md:text-base font-medium tracking-widest uppercase mb-4 transition-all duration-700 delay-100 ${index === currentSlide
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4'
                  }`}
              >
                {slide.subtitle}
              </p>

              {/* Title */}
              <h1
                className={`font-display text-6xl md:text-8xl lg:text-9xl font-bold text-white mb-6 transition-all duration-700 delay-200 ${index === currentSlide
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-8'
                  }`}
              >
                {slide.title}
              </h1>

              {/* Description */}
              <p
                className={`text-white/80 text-lg md:text-xl max-w-lg mb-8 transition-all duration-700 delay-300 ${index === currentSlide
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4'
                  }`}
              >
                {slide.description}
              </p>

              {/* CTA Button */}
              <button
                onClick={handleCTAClick}
                className={`group flex items-center gap-3 bg-white text-gray-900 px-8 py-4 rounded-full font-medium transition-all duration-700 delay-400 hover:bg-coral-400 hover:text-white ${index === currentSlide
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4'
                  }`}
              >
                {slide.cta}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Slide Navigation */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4">
        <button
          onClick={prevSlide}
          className="p-3 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                if (!isAnimating) {
                  setIsAnimating(true);
                  setCurrentSlide(index);
                  setTimeout(() => setIsAnimating(false), 800);
                }
              }}
              className={`w-12 h-1 rounded-full transition-all duration-300 ${index === currentSlide
                ? 'bg-white'
                : 'bg-white/40 hover:bg-white/60'
                }`}
            />
          ))}
        </div>

        <button
          onClick={nextSlide}
          className="p-3 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cream to-transparent z-10" />
    </section>
  );
}
