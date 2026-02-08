import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Star, Truck, RotateCcw, Shield, Minus, Plus, MessageSquare, Camera, Maximize2 } from 'lucide-react';
import { toast } from 'sonner';

import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useCategory } from '@/context/CategoryContext';
import { useTryOn } from '@/context/TryOnContext';
import { useAuth } from '@/context/AuthContext';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReviewShareModal from '@/components/ReviewShareModal';
import ProductSuggestions from '@/components/ProductSuggestions';
import VirtualTryOnModal from '@/components/VirtualTryOnModal';
import ImageLightbox from '@/components/ImageLightbox';
import CommunityTryOns from '@/components/CommunityTryOns';
import { api, API_URL } from '@/lib/api';
import type { Product } from '@/data/products';

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [showReviewShare, setShowReviewShare] = useState(false);
  const [showVirtualTryOn, setShowVirtualTryOn] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { setActiveCategory } = useCategory();
  const { getProductTryOnImage } = useTryOn();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (id) {
      fetchProduct(id);
    }
  }, [id]);

  useEffect(() => {
    if (product) {
      setActiveCategory(product.category);
      if (product.colors && product.colors.length > 0) {
        setSelectedColor(product.colors[0]);
      }
      if (product.sizes && product.sizes.length > 0) {
        setSelectedSize(product.sizes[0]);
      }
    }
  }, [product, setActiveCategory]);

  const fetchProduct = async (productId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/products/${productId}`);
      // Handle both direct data and wrapped response formats
      const productData = response.data || response;
      setProduct(productData);
    } catch (err) {
      setError('Failed to load product details');
      console.error('Failed to fetch product:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity, selectedColor || undefined, selectedSize || undefined);
    }
  };

  const handleBuyNow = () => {
    if (product) {
      addToCart(product, quantity, selectedColor || undefined, selectedSize || undefined);
      navigate('/cart');
    }
  };

  const handleVirtualTryOnClick = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to use Virtual Try-On');
      return;
    }
    setShowVirtualTryOn(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
          <Button onClick={() => navigate('/')} variant="outline">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const discountPercentage = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  // Construct full image URLs - handle both object format {url, isPrimary} and string format
  const backendUrl = API_URL;
  const baseUrl = backendUrl.replace('/api', '');
  const productImageUrls = product.images?.map((img: any) => {
    const url = typeof img === 'string' ? img : img?.url || '';
    return url.startsWith('http') ? url : `${baseUrl}${url}`;
  }) || [];

  // Get try-on image for this product and prepend it to gallery
  const tryOnImage = getProductTryOnImage(product.id);
  const fullImageUrls = tryOnImage
    ? [tryOnImage, ...productImageUrls]
    : productImageUrls;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <button onClick={() => navigate('/')} className="hover:text-foreground">
            Home
          </button>
          <span>/</span>
          <button onClick={() => navigate(`/products?category=${product.category}`)} className="hover:text-foreground">
            {product.category}
          </button>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </div>

        {/* Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div
              className="aspect-square bg-muted rounded-lg overflow-hidden relative group cursor-pointer"
              onClick={() => setShowLightbox(true)}
            >
              <img
                src={fullImageUrls?.[activeImage]}
                alt={product.name}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              {/* Fullscreen button overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                <Button
                  variant="secondary"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLightbox(true);
                  }}
                >
                  <Maximize2 className="h-5 w-5" />
                </Button>
              </div>

              {!isAuthenticated && !/jewel|beauty|lifestyle/i.test(product.category) && (
                <p className="text-sm text-muted-foreground">
                  Please sign in to access Virtual Try-On.
                </p>
              )}
              {/* Try-on badge */}
              {activeImage === 0 && tryOnImage && (
                <Badge className="absolute top-3 left-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  ✨ Your Try-On
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {fullImageUrls?.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(index)}
                  className={`aspect-square bg-muted rounded-lg overflow-hidden border-2 ${activeImage === index ? 'border-primary' : 'border-transparent'
                    }`}
                >
                  <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{product.name}</h1>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                        }`}
                    />
                  ))}
                  <span className="text-sm text-muted-foreground ml-2">({product.reviews} reviews)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-primary">{formatPrice(product.price)}</span>
              {product.originalPrice && (
                <>
                  <span className="text-xl text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
                  <Badge variant="destructive" className="text-sm">
                    {discountPercentage}% OFF
                  </Badge>
                </>
              )}
            </div>

            <p className="text-muted-foreground leading-relaxed">{product.description}</p>

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3">Color</h3>
                <div className="flex gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 rounded-md border-2 text-sm font-medium ${selectedColor === color
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input bg-background hover:bg-accent hover:text-accent-foreground'
                        }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3">Size</h3>
                <div className="flex gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 rounded-md border-2 text-sm font-medium ${selectedSize === size
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input bg-background hover:bg-accent hover:text-accent-foreground'
                        }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <h3 className="text-sm font-medium mb-3">Quantity</h3>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-lg font-medium w-12 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              <Button onClick={handleAddToCart} size="lg" className="flex-1 min-w-[150px]">
                <ShoppingBag className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>
              <Button onClick={handleBuyNow} size="lg" variant="outline" className="flex-1 min-w-[150px]">
                Buy Now
              </Button>
              {!/jewel|beauty|lifestyle/i.test(product.category) && (
                <Button
                  onClick={handleVirtualTryOnClick}
                  size="lg"
                  variant="outline"
                  className="flex-1 min-w-[150px]"
                  disabled={!isAuthenticated}
                >
                  <Camera className="mr-2 h-5 w-5" />
                  Virtual Try-On
                </Button>
              )}
              <Button
                onClick={() => toggleWishlist(product)}
                size="lg"
                variant="outline"
                className={isInWishlist(product.id) ? 'text-red-500' : ''}
              >
                <Heart className={`h-5 w-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 py-6 border-t">
              <div className="text-center">
                <Truck className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Free Shipping</p>
              </div>
              <div className="text-center">
                <RotateCcw className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Easy Returns</p>
              </div>
              <div className="text-center">
                <Shield className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Secure Payment</p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mb-16">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="specifications">Specifications</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="mt-6">
              <div className="prose max-w-none">
                <p>{product.description}</p>
                <h3>Key Features</h3>
                <ul>
                  <li>Premium quality materials</li>
                  <li>Comfortable fit</li>
                  <li>Stylish design</li>
                  <li>Perfect for any occasion</li>
                </ul>
              </div>
            </TabsContent>
            <TabsContent value="specifications" className="mt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Category</h4>
                    <p className="text-muted-foreground">{product.category}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Brand</h4>
                    <p className="text-muted-foreground">Evara</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Material</h4>
                    <p className="text-muted-foreground">Premium Cotton Blend</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Care Instructions</h4>
                    <p className="text-muted-foreground">Machine wash cold</p>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="reviews" className="mt-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Customer Reviews</h3>
                  <Button onClick={() => setShowReviewShare(true)}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Write a Review
                  </Button>
                </div>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No reviews yet. Be the first to review this product!</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Community Try-Ons */}
        <CommunityTryOns productId={product.id} />

        {/* Product Suggestions */}
        <ProductSuggestions
          currentProduct={product}
          category={product.category}
        />
      </div>

      {/* Review Share Modal */}
      {showReviewShare && (
        <ReviewShareModal
          isOpen={showReviewShare}
          onClose={() => setShowReviewShare(false)}
          productId={product.id}
          productName={product.name}
          productImage={product.images?.[0] || ''}
        />
      )}

      {showVirtualTryOn && (
        <VirtualTryOnModal
          isOpen={showVirtualTryOn}
          onClose={() => setShowVirtualTryOn(false)}
          product={product}
        />
      )}

      {/* Image Lightbox */}
      <ImageLightbox
        images={fullImageUrls}
        initialIndex={activeImage}
        isOpen={showLightbox}
        onClose={() => setShowLightbox(false)}
      />
    </div>
  );
}
