import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Filter, X, ChevronDown, Grid3X3, List, SlidersHorizontal, Star, ShoppingBag, Heart, User } from 'lucide-react';
import { type Product } from '@/data/products';
import { api } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useCategory } from '@/context/CategoryContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import ProductCard from '@/components/ProductCard';
import ProductDetail from '@/components/ProductDetail';
import Footer from '@/sections/Footer';

interface FilterState {
  categories: string[];
  subcategories: string[];
  priceRange: [number, number];
  ratings: number[];
  colors: string[];
  inStock: boolean;
  onSale: boolean;
}

export default function ProductsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { getCartCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { setActiveCategory, getBackgroundClass } = useCategory();

  // URL params
  const categoryParam = searchParams.get('category') || 'all';
  const searchQuery = searchParams.get('search') || '';
  const sortParam = searchParams.get('sort') || 'featured';

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Ensure the API response structure matches expectations. 
        // If backend returns { success: true, data: [...] }, adjust accordingly.
        // Based on typical express controllers, it might return the array directly or wrapped.
        const response = await api.get('/products');
        // Handle response wrapping (response.data vs response directly)
        const rawProducts = Array.isArray(response.data) ? response.data : (Array.isArray(response) ? response : []);

        // Map backend data to frontend Product interface
        const mappedProducts = rawProducts.map((p: any) => ({
          id: p._id, // Map _id to id
          name: p.name,
          description: p.description,
          price: Number(p.price),
          originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
          image: p.images?.[0]?.url || '', // Map first image to image property
          category: p.category,
          subcategory: p.subcategory,
          rating: Number(p.rating) || 0,
          reviews: Number(p.reviewCount) || 0,
          inStock: (p.stock > 0) || (p.inStock === true), // Handle both stock count and boolean
          isNew: p.isNew,
          isBestseller: p.isBestseller,
          colors: p.variants?.colors?.map((c: any) => c.name) || [], // Flatten colors
          sizes: p.variants?.sizes?.map((s: any) => s.name) || [], // Flatten sizes
        }));

        console.log('API Response:', response);
        console.log('Raw Products:', rawProducts);
        console.log('Mapped Products:', mappedProducts);

        setProducts(mappedProducts);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Filters
  const [filters, setFilters] = useState<FilterState>({
    categories: categoryParam !== 'all' ? [categoryParam] : [],
    subcategories: [],
    priceRange: [0, 200000],
    ratings: [],
    colors: [],
    inStock: false,
    onSale: false,
  });

  // Set category based on URL param
  useEffect(() => {
    if (categoryParam === 'dress' || categoryParam === 'jewelry' || categoryParam === 'beauty') {
      setActiveCategory(categoryParam);
    } else {
      setActiveCategory('all');
    }
  }, [categoryParam, setActiveCategory]);
  const allSubcategories = useMemo(() => {
    const subs = new Set<string>();
    products.forEach(p => subs.add(p.subcategory));
    return Array.from(subs).sort();
  }, []);

  const allColors = useMemo(() => {
    const colors = new Set<string>();
    products.forEach(p => p.colors?.forEach(c => colors.add(c)));
    return Array.from(colors).sort();
  }, []);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.subcategory.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (filters.categories.length > 0) {
      result = result.filter(p => filters.categories.includes(p.category));
    }

    // Subcategory filter
    if (filters.subcategories.length > 0) {
      result = result.filter(p => filters.subcategories.includes(p.subcategory));
    }

    // Price filter
    result = result.filter(p =>
      p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
    );

    // Rating filter
    if (filters.ratings.length > 0) {
      const minRating = Math.min(...filters.ratings);
      result = result.filter(p => p.rating >= minRating);
    }

    // Color filter
    if (filters.colors.length > 0) {
      result = result.filter(p =>
        p.colors?.some(c => filters.colors.includes(c))
      );
    }

    // Stock filter
    if (filters.inStock) {
      result = result.filter(p => p.inStock);
    }

    // Sale filter
    if (filters.onSale) {
      result = result.filter(p => p.originalPrice && p.originalPrice > p.price);
    }

    // Sort
    switch (sortParam) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      case 'bestseller':
        result.sort((a, b) => (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0));
        break;
      default:
        // Featured - default order
        break;
    }

    return result;
  }, [filters, searchQuery, sortParam]);

  // Handlers
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (localSearch) {
      newParams.set('search', localSearch);
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
  };

  const handleCategoryChange = (category: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (category === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', category);
    }
    setSearchParams(newParams);

    setFilters(prev => ({
      ...prev,
      categories: category === 'all' ? [] : [category]
    }));
  };

  const handleSortChange = (sort: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', sort);
    setSearchParams(newParams);
  };

  const toggleFilter = (type: keyof FilterState, value: string | number) => {
    setFilters(prev => {
      const current = prev[type] as (string | number)[];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [type]: updated };
    });
  };

  const clearFilters = () => {
    setFilters({
      categories: [],
      subcategories: [],
      priceRange: [0, 200000],
      ratings: [],
      colors: [],
      inStock: false,
      onSale: false,
    });
    setLocalSearch('');
    setSearchParams(new URLSearchParams());
  };

  const openProductDetail = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailOpen(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const activeFiltersCount =
    filters.subcategories.length +
    filters.ratings.length +
    filters.colors.length +
    (filters.inStock ? 1 : 0) +
    (filters.onSale ? 1 : 0) +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 200000 ? 1 : 0);

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getBackgroundClass()} transition-colors duration-500`}>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg shadow-sm py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="font-display text-2xl font-bold text-gray-900 hover:text-coral-400 transition-colors"
            >
              Evara
            </button>

            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/products')}
                className="text-sm font-medium text-gray-700 hover:text-coral-400 transition-colors"
              >
                Products
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors relative">
                <Heart className="w-5 h-5 text-gray-700" />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-coral-400 text-white text-xs rounded-full flex items-center justify-center">
                    {wishlistItems.length}
                  </span>
                )}
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors relative">
                <ShoppingBag className="w-5 h-5 text-gray-700" />
                {getCartCount() > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-coral-400 text-white text-xs rounded-full flex items-center justify-center">
                    {getCartCount()}
                  </span>
                )}
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <User className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Header Section */}
      <div className="pt-24 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <button onClick={() => navigate('/')} className="hover:text-coral-400">Home</button>
            <span>/</span>
            <span className="text-gray-900 capitalize">{categoryParam === 'all' ? 'All Products' : categoryParam}</span>
          </nav>

          <h1 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {categoryParam === 'all' ? 'All Products' : `${categoryParam.charAt(0).toUpperCase() + categoryParam.slice(1)} Collection`}
          </h1>
          <p className="text-gray-600">{filteredProducts.length} products found</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          {/* Search and Filter Bar */}
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search products..."
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    className="pl-10 pr-4 py-3 w-full"
                  />
                  {localSearch && (
                    <button
                      type="button"
                      onClick={() => { setLocalSearch(''); handleSearch({ preventDefault: () => { } } as React.FormEvent); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
              </form>

              {/* Category Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'dress', label: 'Dresses' },
                  { id: 'jewelry', label: 'Jewelry' },
                  { id: 'beauty', label: 'Beauty' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${(cat.id === 'all' && categoryParam === 'all') || categoryParam === cat.id
                      ? 'bg-coral-400 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortParam}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="appearance-none bg-gray-100 px-4 py-3 pr-10 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="newest">Newest First</option>
                  <option value="bestseller">Bestsellers</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>

              {/* View Mode */}
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-coral-400 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-coral-400 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Filter Button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden relative">
                    <SlidersHorizontal className="w-5 h-5 mr-2" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 bg-coral-400 text-white">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full sm:w-80 overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <FilterContent />
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <div className="flex gap-8">
            {/* Sidebar Filters - Desktop */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Filters
                  </h3>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-coral-400 hover:text-coral-500"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <FilterContent />
              </div>
            </aside>

            {/* Product Grid */}
            <main className="flex-1">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-400"></div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-600 mb-4">Try adjusting your filters or search query</p>
                  <Button onClick={clearFilters} variant="outline">
                    Clear all filters
                  </Button>
                </div>
              ) : (
                <div className={viewMode === 'grid'
                  ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
                  : "flex flex-col gap-4"
                }>
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onClick={() => openProductDetail(product)}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      <Footer />

      {/* Product Detail Modal */}
      <ProductDetail
        product={selectedProduct}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  );

  function FilterContent() {
    return (
      <div className="space-y-6">
        {/* Price Range */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Price Range</h4>
          <div className="px-2">
            <Slider
              value={filters.priceRange}
              onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value as [number, number] }))}
              max={200000}
              step={1000}
              className="mb-4"
            />
            <div className="flex justify-between text-sm text-gray-600">
              <span>{formatPrice(filters.priceRange[0])}</span>
              <span>{formatPrice(filters.priceRange[1])}</span>
            </div>
          </div>
        </div>

        {/* Subcategories */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Subcategories</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {allSubcategories.map((sub) => (
              <label key={sub} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={filters.subcategories.includes(sub)}
                  onCheckedChange={() => toggleFilter('subcategories', sub)}
                />
                <span className="text-sm text-gray-700 capitalize">{sub.replace('-', ' ')}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Ratings */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Rating</h4>
          <div className="space-y-2">
            {[4, 3, 2, 1].map((rating) => (
              <label key={rating} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={filters.ratings.includes(rating)}
                  onCheckedChange={() => toggleFilter('ratings', rating)}
                />
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                  <span className="text-sm text-gray-600 ml-1">& Up</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Colors</h4>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
            {allColors.map((color) => (
              <button
                key={color}
                onClick={() => toggleFilter('colors', color)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${filters.colors.includes(color)
                  ? 'border-coral-400 bg-coral-50 text-coral-400'
                  : 'border-gray-200 text-gray-700 hover:border-coral-400'
                  }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>

        {/* Other Filters */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Other</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={filters.inStock}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, inStock: checked as boolean }))}
              />
              <span className="text-sm text-gray-700">In Stock Only</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={filters.onSale}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, onSale: checked as boolean }))}
              />
              <span className="text-sm text-gray-700">On Sale</span>
            </label>
          </div>
        </div>
      </div>
    );
  }
}
