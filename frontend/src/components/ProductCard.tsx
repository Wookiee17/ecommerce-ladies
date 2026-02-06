import { Heart, ShoppingCart, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Product } from '@/data/products';
import { useTryOn } from '@/context/TryOnContext';
import { Loader2 } from 'lucide-react'; // For loading state

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
  viewMode?: 'grid' | 'list';
}

export default function ProductCard({ product, onClick, viewMode = 'grid' }: ProductCardProps) {
  const { userImage, generatedImages, generateTryOn, loading } = useTryOn();

  // Check if we have a generated image for this product
  const productId = (product as any)._id || product.id;
  const tryOnImage = generatedImages.get(productId);
  const displayImage = tryOnImage || product.image;

  /* Removed unused isGenerating variable */

  const handleTryOnClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (userImage) {
      await generateTryOn((product as any)._id || product.id, product.image);
    } else {
      alert("Please upload your photo in the header first!");
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (viewMode === 'list') {
    return (
      <div
        onClick={onClick}
        className="bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
      >
        <div className="flex">
          {/* Image */}
          <div className="w-48 h-48 flex-shrink-0">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=500&q=80';
              }}
            />
          </div>

          {/* Content */}
          <div className="flex-1 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm text-gray-500 capitalize">{product.subcategory}</p>
                  <h3 className="font-semibold text-lg text-gray-900">{product.name}</h3>
                </div>
                <div className="flex gap-2">
                  {product.isNew && (
                    <Badge className="bg-green-500 text-white">New</Badge>
                  )}
                  {product.isBestseller && (
                    <Badge className="bg-coral-400 text-white">Bestseller</Badge>
                  )}
                  {product.originalPrice && product.originalPrice > product.price && (
                    <Badge className="bg-red-500 text-white">
                      {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                    </Badge>
                  )}
                </div>
              </div>

              <p className="text-gray-600 text-sm line-clamp-2 mb-3">{product.description}</p>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < Math.floor(product.rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                        }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {product.rating} ({product.reviews} reviews)
                </span>
              </div>

              {/* Colors */}
              {product.colors && product.colors.length > 0 && (
                <div className="flex gap-2 mb-3">
                  {product.colors.slice(0, 4).map((color) => (
                    <span
                      key={color}
                      className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700"
                    >
                      {color}
                    </span>
                  ))}
                  {product.colors.length > 4 && (
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                      +{product.colors.length - 4}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Price and Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-gray-900">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-lg text-gray-400 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="icon">
                  <Heart className="w-5 h-5" />
                </Button>
                <Button className="bg-coral-400 hover:bg-coral-500 text-white">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300"
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={displayImage}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=500&q=80';
          }}
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.isNew && (
            <Badge className="bg-green-500 text-white">New</Badge>
          )}
          {product.isBestseller && (
            <Badge className="bg-coral-400 text-white">Bestseller</Badge>
          )}
          {product.originalPrice && product.originalPrice > product.price && (
            <Badge className="bg-red-500 text-white">
              {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
            </Badge>
          )}

          {/* Virtual Try-On Badge/Button */}
          {((product.category as string) === 'women' || (product.category as string) === 'jewelry') && ( // Simple category check
            <Button
              variant="secondary"
              size="sm"
              className={`text-xs h-7 shadow-sm backdrop-blur-md ${tryOnImage ? 'bg-green-100 text-green-700' : 'bg-white/80'}`}
              onClick={handleTryOnClick}
            >
              {/* Show different states */}
              {/* 1. If loading globally, and we don't know specifically which ID is loading, we might show generic. But let's assume global loading for now. Ideal: track loading ID. */}
              {/* Simplification: If global loading is true, we show spinner here if we don't have an image yet? No, that's messy. Global loading blocks everything in current context. */}
              {loading && !tryOnImage ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              {tryOnImage ? 'View Original' : userImage ? 'Try On Me' : 'Virtual Try-On'}
            </Button>
          )}
        </div>

        {/* Quick Actions */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="secondary" size="icon" className="bg-white/90 hover:bg-white">
            <Heart className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
          {product.subcategory}
        </p>

        {/* Name */}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-coral-400 transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${i < Math.floor(product.rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
                  }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">({product.reviews})</span>
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

        {/* Colors */}
        {product.colors && product.colors.length > 0 && (
          <div className="flex gap-1 mt-3">
            {product.colors.slice(0, 3).map((color) => (
              <span
                key={color}
                className="w-5 h-5 rounded-full border border-gray-200"
                style={{
                  backgroundColor: color.toLowerCase() === 'white' ? '#f9fafb' :
                    color.toLowerCase() === 'black' ? '#1f2937' : color.toLowerCase()
                }}
                title={color}
              />
            ))}
            {product.colors.length > 3 && (
              <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-600">
                +{product.colors.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
