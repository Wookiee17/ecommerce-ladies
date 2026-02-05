import { useRef, useEffect, useState } from 'react';
import { Truck, RotateCcw, Shield, Headphones } from 'lucide-react';

const features = [
  {
    icon: Truck,
    title: 'Free Shipping',
    description: 'Free delivery on orders above ₹999 across India',
  },
  {
    icon: RotateCcw,
    title: 'Easy Returns',
    description: '30-day hassle-free return policy',
  },
  {
    icon: Shield,
    title: 'Secure Payment',
    description: '100% secure payment with SSL encryption',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    description: 'Round the clock customer assistance',
  },
];

export default function Features() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

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

  return (
    <section
      ref={sectionRef}
      className="py-16 md:py-24 section-padding bg-white"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div
          className={`text-center mb-12 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <p className="text-coral-400 text-sm font-medium tracking-widest uppercase mb-3">
            Why Choose Us
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900">
            The Evara Experience
          </h2>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`group text-center p-6 md:p-8 rounded-2xl bg-cream hover:bg-white hover:shadow-soft transition-all duration-500 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
              }`}
              style={{ transitionDelay: `${index * 100 + 200}ms` }}
            >
              {/* Icon */}
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-coral-100 flex items-center justify-center group-hover:bg-coral-400 group-hover:scale-110 transition-all duration-300">
                <feature.icon className="w-7 h-7 text-coral-400 group-hover:text-white transition-colors" />
              </div>

              {/* Content */}
              <h3 className="font-display text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
