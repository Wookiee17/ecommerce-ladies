import { useState, useRef, useEffect } from 'react';
import { Send, CheckCircle } from 'lucide-react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setEmail('');
      }, 3000);
    }
  };

  return (
    <section
      ref={sectionRef}
      className="py-20 md:py-32 section-padding bg-gray-900 relative overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-coral-400 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold-400 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        {/* Content */}
        <div
          className={`transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <p className="text-coral-400 text-sm font-medium tracking-widest uppercase mb-4">
            Stay Updated
          </p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            Get <span className="text-gradient">30% Off</span>
          </h2>
          <p className="text-white/70 text-lg md:text-xl mb-8">
            On your first order when you subscribe to our newsletter
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className={`max-w-md mx-auto transition-all duration-700 delay-200 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {!isSubmitted ? (
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-6 py-4 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-coral-400 focus:ring-2 focus:ring-coral-400/20 transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                className="px-6 py-4 rounded-full bg-coral-400 text-white font-medium hover:bg-coral-500 transition-colors flex items-center gap-2"
              >
                <span className="hidden sm:inline">Subscribe</span>
                <Send className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 text-green-400 bg-green-400/10 py-4 px-6 rounded-full">
              <CheckCircle className="w-5 h-5" />
              <span>Thank you for subscribing!</span>
            </div>
          )}
        </form>

        {/* Trust Badges */}
        <div
          className={`flex flex-wrap justify-center gap-6 mt-12 text-white/50 text-sm transition-all duration-700 delay-300 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <span>No spam, ever</span>
          <span>•</span>
          <span>Unsubscribe anytime</span>
          <span>•</span>
          <span>Exclusive deals only</span>
        </div>
      </div>
    </section>
  );
}
