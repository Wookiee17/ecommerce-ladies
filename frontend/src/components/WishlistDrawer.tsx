import { Heart, ShoppingBag, X, ArrowRight } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WishlistDrawer({ isOpen, onClose }: WishlistDrawerProps) {
  const { items, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleMoveToCart = (product: typeof items[0]) => {
    addToCart(product);
    removeFromWishlist(product.id);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5" />
              My Wishlist ({items.length})
            </SheetTitle>
            {items.length > 0 && (
              <button
                onClick={clearWishlist}
                className="text-sm text-gray-500 hover:text-red-500 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Heart className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="font-display text-xl font-semibold text-gray-900 mb-2">
              Your wishlist is empty
            </h3>
            <p className="text-gray-500 mb-6">
              Save your favorite items to your wishlist and find them easily later.
            </p>
            <Button onClick={onClose} className="bg-coral-400 hover:bg-coral-500 text-white">
              Explore Products
            </Button>
          </div>
        ) : (
          <>
            {/* Wishlist Items */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 bg-gray-50 rounded-xl group"
                >
                  {/* Image */}
                  <div className="w-24 h-32 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                          {item.subcategory}
                        </p>
                        <h4 className="font-medium text-gray-900 mt-1 line-clamp-2">
                          {item.name}
                        </h4>
                      </div>
                      <button
                        onClick={() => removeFromWishlist(item.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="font-semibold text-gray-900">
                        {formatPrice(item.price)}
                      </span>
                      {item.originalPrice && (
                        <span className="text-sm text-gray-400 line-through">
                          {formatPrice(item.originalPrice)}
                        </span>
                      )}
                    </div>

                    {/* Stock Status */}
                    <p className={`text-sm mt-1 ${item.inStock ? 'text-green-600' : 'text-red-500'}`}>
                      {item.inStock ? 'In Stock' : 'Out of Stock'}
                    </p>

                    {/* Move to Cart Button */}
                    <Button
                      onClick={() => handleMoveToCart(item)}
                      disabled={!item.inStock}
                      className="mt-auto w-full bg-coral-400 hover:bg-coral-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      size="sm"
                    >
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Move to Cart
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t pt-4">
              <Button
                onClick={onClose}
                variant="outline"
                className="w-full"
              >
                Continue Shopping
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
