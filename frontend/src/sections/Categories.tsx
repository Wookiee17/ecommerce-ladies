import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { categories } from '@/data/products';
import { useCategory } from '@/context/CategoryContext';

export default function Categories() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { setActiveCategory } = useCategory();
  const navigate = useNavigate();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId as 'dress' | 'jewelry' | 'beauty');
    // Navigate to ProductsPage with category filter
    navigate(`/products?category=${categoryId}`);
  };

  return (
    <section
      ref={sectionRef}
      className="py-20 md:py-32 section-padding bg-cream"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div
          className={`text-center mb-16 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <p className="text-coral-400 text-sm font-medium tracking-widest uppercase mb-3">
            Shop by Category
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Explore Our Collections
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our curated selection of dresses, jewelry, and beauty electronics designed for the modern Indian woman
          </p>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {categories.map((category: {id: string; name: string; description: string; image: string; itemCount: number}, index: number) => (
            <div
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={`group relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-700 ${
                isVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-12'
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              {/* Background Image */}
              <div className="aspect-[3/4] overflow-hidden">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                <p className="text-white/70 text-sm mb-2">{category.itemCount} Products</p>
                <h3 className="font-display text-2xl md:text-3xl font-bold text-white mb-2">
                  {category.name}
                </h3>
                <p className="text-white/80 text-sm mb-4">{category.description}</p>
                <div className="flex items-center gap-2 text-white group-hover:text-coral-300 transition-colors">
                  <span className="text-sm font-medium">Explore</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Hover Border Effect */}
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-white/30 rounded-3xl transition-colors duration-300" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
