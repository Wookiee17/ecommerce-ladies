import { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Heart, Search, Menu, X, User, Clock, TrendingUp, Camera, Bell, LogOut, Package, Settings, MapPin } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useCategory } from '@/context/CategoryContext';
import { useAuth } from '@/context/AuthContext';
import { useSearch } from '@/context/SearchContext';
import { categories } from '@/data/products';
import Notifications from '@/components/Notifications';

interface NavigationProps {
  onCartClick: () => void;
  onWishlistClick: () => void;
  onAuthClick: () => void;
  onImageSearchClick?: () => void;
}

export default function Navigation({ onCartClick, onWishlistClick, onAuthClick, onImageSearchClick }: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { getCartCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { activeCategory, setActiveCategory } = useCategory();
  const { isAuthenticated, user } = useAuth();
  const { recentSearches, trendingSearches, getSuggestions, addToHistory } = useSearch();

  // Fetch unread count periodically
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/notifications/unread-count', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        if (data.success) {
          setUnreadCount(data.data.unreadCount);
        }
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Handle scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when search opens
  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isSearchOpen]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId as 'all' | 'dress' | 'jewelry' | 'beauty');
    scrollToSection('products');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      addToHistory(searchQuery);
      setShowSuggestions(false);
      scrollToSection('products');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    addToHistory(suggestion);
    setShowSuggestions(false);
    scrollToSection('products');
  };

  const suggestions = getSuggestions(searchQuery);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
          ? 'bg-white/90 backdrop-blur-lg shadow-soft py-3'
          : 'bg-transparent py-5'
          }`}
      >
        <div className="section-padding">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <button
              onClick={() => {
                setActiveCategory('all');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2 group"
            >
              <span className="font-display text-2xl md:text-3xl font-bold text-gray-900 group-hover:text-coral-400 transition-colors">
                Evara
              </span>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              <button
                onClick={() => handleCategoryClick('all')}
                className={`text-sm font-medium transition-colors ${activeCategory === 'all' ? 'text-coral-400' : 'text-gray-700 hover:text-coral-400'
                  }`}
              >
                Home
              </button>
              {categories.map((cat: { id: string; name: string }) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`text-sm font-medium transition-colors ${activeCategory === cat.id ? 'text-coral-400' : 'text-gray-700 hover:text-coral-400'
                    }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3 md:gap-4">
              {/* Search */}
              <button
                onClick={() => {
                  setIsSearchOpen(!isSearchOpen);
                  setShowSuggestions(true);
                }}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Search className="w-5 h-5 text-gray-700" />
              </button>

              {/* Wishlist */}
              <button
                onClick={onWishlistClick}
                className="hidden sm:flex p-2 rounded-full hover:bg-gray-100 transition-colors relative"
              >
                <Heart className="w-5 h-5 text-gray-700" />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-coral-400 text-white text-xs rounded-full flex items-center justify-center">
                    {wishlistItems.length}
                  </span>
                )}
              </button>

              {/* Cart */}
              <button
                onClick={onCartClick}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
              >
                <ShoppingBag className="w-5 h-5 text-gray-700" />
                {getCartCount() > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-coral-400 text-white text-xs rounded-full flex items-center justify-center">
                    {getCartCount()}
                  </span>
                )}
              </button>

              {/* Notifications */}
              {isAuthenticated && (
                <button
                  onClick={() => setIsNotificationsOpen(true)}
                  className="hidden sm:flex p-2 rounded-full hover:bg-gray-100 transition-colors relative"
                >
                  <Bell className="w-5 h-5 text-gray-700" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              )}

              {/* User */}


              // ... existing imports ...

              // Inside Navigation component return
              {/* User Dropdown */}
              {isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="hidden sm:flex p-2 rounded-full hover:bg-gray-100 transition-colors items-center gap-2 outline-none">
                      <div className="w-8 h-8 rounded-full bg-coral-100 flex items-center justify-center text-coral-600 font-medium border border-coral-200">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-700 hidden xl:inline">
                        {user.name.split(' ')[0]}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <Package className="mr-2 h-4 w-4" />
                      <span>Orders</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <MapPin className="mr-2 h-4 w-4" />
                      <span>Saved Addresses</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                      onClick={() => {
                        // Assuming logout function exists in context, otherwise handle manually
                        localStorage.removeItem('token');
                        localStorage.removeItem('evara_user');
                        window.location.reload();
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button
                  onClick={onAuthClick}
                  className="hidden sm:flex p-2 rounded-full hover:bg-gray-100 transition-colors items-center gap-2"
                >
                  <User className="w-5 h-5 text-gray-700" />
                  <span className="text-sm text-gray-700 hidden xl:inline">Sign In</span>
                </button>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-gray-700" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-700" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar with Suggestions */}
        <div
          className={`overflow-hidden transition-all duration-300 ${isSearchOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
            }`}
        >
          <div className="section-padding py-4 bg-white/95 backdrop-blur-lg border-t">
            <div ref={searchRef} className="relative max-w-2xl mx-auto">
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Search for products..."
                  className="w-full pl-12 pr-12 py-3 rounded-full border border-gray-200 focus:border-coral-400 focus:ring-2 focus:ring-coral-400/20 outline-none transition-all"
                />
                {onImageSearchClick && (
                  <button
                    type="button"
                    onClick={onImageSearchClick}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-100 transition-colors"
                    title="Search by image"
                  >
                    <Camera className="w-5 h-5 text-gray-400 hover:text-coral-400" />
                  </button>
                )}
              </form>

              {/* Search Suggestions Dropdown */}
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-50">
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && !searchQuery && (
                    <div className="p-4 border-b">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>Recent Searches</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((search) => (
                          <button
                            key={search}
                            onClick={() => handleSuggestionClick(search)}
                            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-coral-100 hover:text-coral-600 rounded-full transition-colors"
                          >
                            {search}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trending Searches */}
                  {!searchQuery && (
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
                        <TrendingUp className="w-4 h-4" />
                        <span>Trending Now</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {trendingSearches.slice(0, 6).map((search) => (
                          <button
                            key={search}
                            onClick={() => handleSuggestionClick(search)}
                            className="px-3 py-1.5 text-sm bg-rose-50 text-rose-600 hover:bg-coral-100 hover:text-coral-600 rounded-full transition-colors"
                          >
                            {search}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Search Suggestions */}
                  {searchQuery && suggestions.length > 0 && (
                    <div className="p-2">
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 rounded-lg flex items-center gap-3 transition-colors"
                        >
                          <Search className="w-4 h-4 text-gray-400" />
                          <span className="flex-1">{suggestion}</span>
                          <span className="text-xs text-gray-400">Search</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* No Results */}
                  {searchQuery && suggestions.length === 0 && (
                    <div className="p-4 text-center text-gray-500">
                      <p>No suggestions found</p>
                      <p className="text-sm mt-1">Press Enter to search for &quot;{searchQuery}&quot;</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ${isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
        >
          <div className="section-padding py-4 bg-white/95 backdrop-blur-lg border-t space-y-2">
            <button
              onClick={() => handleCategoryClick('all')}
              className="block w-full text-left py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Home
            </button>
            {categories.map((cat: { id: string; name: string }) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className="block w-full text-left py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                {cat.name}
              </button>
            ))}
            <div className="pt-4 border-t flex gap-4">
              <button
                onClick={onWishlistClick}
                className="flex items-center gap-2 py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Heart className="w-5 h-5" />
                <span>Wishlist ({wishlistItems.length})</span>
              </button>
              <button
                onClick={onAuthClick}
                className="flex items-center gap-2 py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <User className="w-5 h-5" />
                <span>{isAuthenticated ? 'Profile' : 'Sign In'}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Notifications Panel */}
      <Notifications
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </>
  );
}
