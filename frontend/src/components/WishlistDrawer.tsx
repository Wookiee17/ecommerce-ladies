import { useWishlist } from '@/context/WishlistContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Heart, X, ShoppingBag, ArrowRight } from 'lucide-react';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WishlistDrawer({ isOpen, onClose }: WishlistDrawerProps) {
  const { wishlist, removeFromWishlist, moveToCart } = useWishlist();

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md flex flex-col bg-white">
        <SheetHeader className="border-b border-gray-100 pb-4">
          <SheetTitle className="font-display text-2xl font-bold flex items-center gap-2">
            Your Wishlist <span className="text-gray-400 text-lg font-normal">({wishlist.length})</span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-6 -mx-6 px-6">
          {wishlist.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                <Heart className="h-10 w-10 text-gray-300" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-gray-900 mb-1">Your wishlist is empty</h3>
                <p className="text-gray-500">Save items you love to revisit later.</p>
              </div>
              <Button
                onClick={() => document.querySelector('[data-radix-collection-item]')?.dispatchEvent(new Event('click'))}
                className="mt-4 bg-coral-400 hover:bg-coral-500 text-white"
              >
                Start Exploring
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {wishlist.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 border border-gray-100 rounded-xl hover:shadow-sm transition-shadow group">
                  <div className="w-24 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                    <img
                      src={item.image || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800"}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {!item.inStock && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-xs font-bold px-2 py-1 bg-black/50 rounded-full backdrop-blur-sm">Sold Out</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-gray-900 line-clamp-2">{item.name}</h4>
                        <button
                          onClick={() => removeFromWishlist(item.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1 -mr-2"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="font-bold text-gray-900 mt-1">₹{item.price.toFixed(2)}</p>
                    </div>

                    <Button
                      onClick={() => moveToCart(item)}
                      disabled={!item.inStock}
                      className="w-full bg-gray-900 hover:bg-gray-800 text-white shadow-none mt-2 h-9 text-xs"
                      size="sm"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 mr-2" />
                      Add to Cart
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
