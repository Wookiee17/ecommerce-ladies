import { useState, useEffect } from 'react';
import { Heart, ShoppingBag, Star, Truck, RotateCcw, Shield, Minus, Plus, MessageSquare } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useCategory } from '@/context/CategoryContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReviewShareModal from './ReviewShareModal';
import type { Product } from '@/data/products';

interface ProductDetailProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductDetail({ product, isOpen, onClose }: ProductDetailProps) {
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [showReviewShare, setShowReviewShare] = useState(false);
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { setActiveCategory } = useCategory();

  // Set category background when product is opened
  useEffect(() => {
    if (isOpen && product) {
      setActiveCategory(product.category);
    }
  }, [isOpen, product, setActiveCategory]);

  if (!product) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedColor || undefined, selectedSize || undefined);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-0">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Image Section */}
          <div className="bg-gray-50 p-6 lg:p-8">
            {/* Main Image */}
            <div className="aspect-[3/4] rounded-2xl overflow-hidden mb-4">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnail Images */}
            <div className="flex gap-3 justify-center">
              {(product.images && product.images.length > 0 ? product.images : [product.image]).map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${activeImage === i ? 'border-coral-400' : 'border-transparent'
                    }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} view ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Details Section */}
          <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wide">
                  {product.category} / {product.subcategory}
                </p>
                <h1 className="font-display text-2xl lg:text-3xl font-bold text-gray-900 mt-1">
                  {product.name}
                </h1>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleWishlist(product)}
                  className={`p-2 rounded-full border transition-colors ${isInWishlist(product.id)
                      ? 'border-coral-400 bg-coral-50 text-coral-400'
                      : 'border-gray-200 hover:border-coral-400'
                    }`}
                >
                  <Heart
                    className="w-5 h-5"
                    fill={isInWishlist(product.id) ? 'currentColor' : 'none'}
                  />
                </button>
                <button
                  onClick={() => setShowReviewShare(true)}
                  className="p-2 rounded-full border border-gray-200 hover:border-coral-400 transition-colors"
                  title="Share Review Link"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < Math.floor(product.rating)
                        ? 'fill-gold-400 text-gold-400'
                        : 'text-gray-300'
                      }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {product.rating} ({product.reviews} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl font-bold text-gray-900">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <>
                  <span className="text-xl text-gray-400 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                  <Badge className="bg-green-500 text-white">
                    {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                  </Badge>
                </>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-600 mb-6">{product.description}</p>

            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Color {selectedColor && `- ${selectedColor}`}
                </p>
                <div className="flex gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 rounded-lg text-sm border transition-colors ${selectedColor === color
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
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Size {selectedSize && `- ${selectedSize}`}
                </p>
                <div className="flex gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-12 h-12 rounded-lg text-sm border transition-colors ${selectedSize === size
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

            {/* Quantity */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Quantity</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:border-coral-400 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:border-coral-400 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mb-8">
              <Button
                onClick={handleAddToCart}
                className="flex-1 bg-coral-400 hover:bg-coral-500 text-white py-6"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                Add to Cart
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  handleAddToCart();
                }}
                className="flex-1 py-6"
              >
                Buy Now
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 py-6 border-t">
              <div className="text-center">
                <Truck className="w-6 h-6 mx-auto mb-2 text-coral-400" />
                <p className="text-xs text-gray-600">Free Shipping</p>
              </div>
              <div className="text-center">
                <RotateCcw className="w-6 h-6 mx-auto mb-2 text-coral-400" />
                <p className="text-xs text-gray-600">Easy Returns</p>
              </div>
              <div className="text-center">
                <Shield className="w-6 h-6 mx-auto mb-2 text-coral-400" />
                <p className="text-xs text-gray-600">Secure Payment</p>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="details" className="mt-6">
              <TabsList className="w-full">
                <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
                <TabsTrigger value="shipping" className="flex-1">Shipping</TabsTrigger>
                <TabsTrigger value="returns" className="flex-1">Returns</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="mt-4 text-sm text-gray-600">
                <ul className="space-y-2">
                  <li>• Premium quality materials</li>
                  <li>• Expertly crafted with attention to detail</li>
                  <li>• Designed for comfort and style</li>
                  <li>• Perfect for special occasions</li>
                </ul>
              </TabsContent>
              <TabsContent value="shipping" className="mt-4 text-sm text-gray-600">
                <p>Free shipping on orders above ₹999. Standard delivery 3-5 business days. Express delivery available for select locations.</p>
              </TabsContent>
              <TabsContent value="returns" className="mt-4 text-sm text-gray-600">
                <p>30-day hassle-free return policy. Items must be unused and in original packaging. Refunds processed within 5-7 business days.</p>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>

      {/* Review Share Modal */}
      <ReviewShareModal
        isOpen={showReviewShare}
        onClose={() => setShowReviewShare(false)}
        productId={product.id}
        productName={product.name}
        productImage={product.image}
      />
    </Dialog>
  );
}
