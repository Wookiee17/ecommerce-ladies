import { useState, useRef, useEffect } from 'react';
import { Heart, ShoppingBag, Star, Eye, Search, AlertCircle } from 'lucide-react';
import { products, type Product } from '@/data/products';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useCategory } from '@/context/CategoryContext';
import { useSearch } from '@/context/SearchContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const tabs = [
  { id: 'all', label: 'All Products' },
  { id: 'new', label: 'New Arrivals' },
  { id: 'bestseller', label: 'Best Sellers' },
  { id: 'sale', label: 'On Sale' },
];

interface ProductsProps {
  onProductClick: (product: Product) => void;
  imageSearchResults?: Product[] | null;
}

export default function Products({ onProductClick, imageSearchResults }: ProductsProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const sectionRef = useRef<HTMLElement>(null);
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { activeCategory, getBackgroundClass } = useCategory();
  const { getSearchResults, addToHistory } = useSearch();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const getFilteredProducts = () => {
    // If image search results are available, use them
    if (imageSearchResults && imageSearchResults.length > 0) {
      return imageSearchResults;
    }

    let filtered = products;

    // Only filter by category if user explicitly clicked a category (not from hero or scroll)
    // This prevents automatic filtering when user scrolls or clicks "Explore Collection"
    // We can add a flag later if explicit category selection is needed

    // Filter by search
    if (searchInput.trim()) {
      const searchResults = getSearchResults(searchInput);
      filtered = filtered.filter(p => searchResults.some(r => r.id === p.id));
    }

    // Filter by tab
    switch (activeTab) {
      case 'new':
        return filtered.filter((p) => p.isNew);
      case 'bestseller':
        return filtered.filter((p) => p.isBestseller);
      case 'sale':
        return filtered.filter((p) => p.originalPrice && p.originalPrice > p.price);
      default:
        return filtered;
    }
  };

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1, selectedColor || undefined, selectedSize || undefined);
  };

  const handleQuickView = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProduct(product);
    setSelectedColor(product.colors?.[0] || '');
    setSelectedSize(product.sizes?.[0] || '');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      addToHistory(searchInput);
    }
  };

  const filteredProducts = getFilteredProducts();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <section
      id="products"
      ref={sectionRef}
      className={`py-20 md:py-32 section-padding bg-gradient-to-b ${getBackgroundClass()} bg-transition`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div
          className={`text-center mb-12 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <p className="text-coral-400 text-sm font-medium tracking-widest uppercase mb-3">
            Our Products
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            All Collections
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Handpicked products curated just for you. Quality meets elegance in every piece.
          </p>
        </div>

        {/* Search Bar */}
        <div
          className={`max-w-md mx-auto mb-8 transition-all duration-700 delay-100 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 focus:border-coral-400 focus:ring-2 focus:ring-coral-400/20 outline-none transition-all"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </form>
        </div>

        {/* Image Search Results Indicator */}
        {imageSearchResults && imageSearchResults.length > 0 && (
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-coral-50 rounded-full">
              <span className="text-sm text-coral-600">
                Showing {imageSearchResults.length} visual matches
              </span>
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-coral-600 hover:text-coral-700 underline"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div
          className={`flex flex-wrap justify-center gap-2 md:gap-4 mb-12 transition-all duration-700 delay-100 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 md:px-6 py-2 md:py-3 rounded-full text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-coral-400 text-white shadow-glow'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => (
              <div
                key={product.id}
                onClick={() => onProductClick(product)}
                className={`group bg-white rounded-2xl overflow-hidden shadow-soft card-hover cursor-pointer transition-all duration-700 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                }`}
                style={{ transitionDelay: `${(index % 8) * 75 + 200}ms` }}
              >
                {/* Image Container */}
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {product.isNew && (
                      <Badge className="bg-coral-400 text-white">New</Badge>
                    )}
                    {product.isBestseller && (
                      <Badge className="bg-gold-400 text-gray-900">Bestseller</Badge>
                    )}
                    {product.originalPrice && product.originalPrice > product.price && (
                      <Badge className="bg-green-500 text-white">
                        {Math.round((1 - product.price / product.originalPrice) * 100)}% Off
                      </Badge>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product);
                      }}
                      className={`p-2 rounded-full shadow-soft transition-colors ${
                        isInWishlist(product.id)
                          ? 'bg-coral-400 text-white'
                          : 'bg-white text-gray-700 hover:bg-coral-400 hover:text-white'
                      }`}
                    >
                      <Heart className="w-4 h-4" fill={isInWishlist(product.id) ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={(e) => handleQuickView(product, e)}
                      className="p-2 rounded-full bg-white text-gray-700 shadow-soft hover:bg-coral-400 hover:text-white transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Add to Cart Button */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <button
                      onClick={(e) => handleAddToCart(product, e)}
                      className="w-full flex items-center justify-center gap-2 bg-coral-400 text-white py-3 rounded-xl font-medium hover:bg-coral-500 transition-colors"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Add to Cart
                    </button>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    {product.subcategory}
                  </p>
                  <h3 className="font-medium text-gray-900 mb-2 line-clamp-1 group-hover:text-coral-400 transition-colors">
                    {product.name}
                  </h3>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="w-4 h-4 fill-gold-400 text-gold-400" />
                    <span className="text-sm text-gray-700">{product.rating}</span>
                    <span className="text-sm text-gray-400">({product.reviews})</span>
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">
                      {formatPrice(product.price)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-gray-400 line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State - Product Not Found */
          <div
            className={`text-center py-16 transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
              <AlertCircle className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="font-display text-xl font-semibold text-gray-900 mb-2">
              No products found
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {searchInput 
                ? `We couldn't find any products matching "${searchInput}". Try a different search term or browse our categories.`
                : 'No products available in this category. Try selecting a different category or tab.'}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  className="px-6 py-3 bg-coral-400 text-white rounded-full font-medium hover:bg-coral-500 transition-colors"
                >
                  Clear Search
                </button>
              )}
              <button
                onClick={() => {
                  setActiveTab('all');
                  setSearchInput('');
                }}
                className="px-6 py-3 border border-gray-200 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-colors"
              >
                View All Products
              </button>
            </div>
            
            {/* Suggestions */}
            <div className="mt-8">
              <p className="text-sm text-gray-500 mb-3">Popular searches:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {['satin dress', 'diamond bracelet', 'LED face mask', 'nail drill', 'gold earrings'].map((term) => (
                  <button
                    key={term}
                    onClick={() => setSearchInput(term)}
                    className="px-4 py-2 text-sm bg-gray-100 hover:bg-coral-100 hover:text-coral-600 rounded-full transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick View Dialog */}
        <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {selectedProduct && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image */}
                <div className="aspect-[3/4] rounded-xl overflow-hidden">
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex flex-col">
                  <DialogHeader>
                    <p className="text-sm text-gray-500 uppercase tracking-wide">
                      {selectedProduct.subcategory}
                    </p>
                    <DialogTitle className="font-display text-2xl">
                      {selectedProduct.name}
                    </DialogTitle>
                  </DialogHeader>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mt-2">
                    <Star className="w-5 h-5 fill-gold-400 text-gold-400" />
                    <span className="text-gray-700">{selectedProduct.rating}</span>
                    <span className="text-gray-400">({selectedProduct.reviews} reviews)</span>
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-3 mt-4">
                    <span className="text-2xl font-bold text-gray-900">
                      {formatPrice(selectedProduct.price)}
                    </span>
                    {selectedProduct.originalPrice && (
                      <span className="text-lg text-gray-400 line-through">
                        {formatPrice(selectedProduct.originalPrice)}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 mt-4">{selectedProduct.description}</p>

                  {/* Colors */}
                  {selectedProduct.colors && selectedProduct.colors.length > 0 && (
                    <div className="mt-6">
                      <p className="text-sm font-medium text-gray-700 mb-2">Color</p>
                      <div className="flex gap-2">
                        {selectedProduct.colors.map((color) => (
                          <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                              selectedColor === color
                                ? 'border-coral-400 bg-coral-50 text-coral-400'
                                : 'border-gray-200 hover:border-coral-400'
                            }`}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sizes */}
                  {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Size</p>
                      <div className="flex gap-2">
                        {selectedProduct.sizes.map((size) => (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={`w-10 h-10 rounded-lg text-sm border transition-colors ${
                              selectedSize === size
                                ? 'border-coral-400 bg-coral-50 text-coral-400'
                                : 'border-gray-200 hover:border-coral-400'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 mt-auto pt-6">
                    <Button
                      onClick={() => {
                        addToCart(selectedProduct, 1, selectedColor || undefined, selectedSize || undefined);
                        setSelectedProduct(null);
                      }}
                      className="flex-1 bg-coral-400 hover:bg-coral-500 text-white"
                    >
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => toggleWishlist(selectedProduct)}
                      className={isInWishlist(selectedProduct.id) ? 'border-coral-400 text-coral-400' : ''}
                    >
                      <Heart
                        className="w-4 h-4"
                        fill={isInWishlist(selectedProduct.id) ? 'currentColor' : 'none'}
                      />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
