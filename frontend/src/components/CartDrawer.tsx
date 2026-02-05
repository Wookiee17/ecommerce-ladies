import { useCart } from '@/context/CartContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingBag, X, Plus, Minus, ArrowRight, Truck } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, removeFromCart, updateQuantity, subtotal, total, coupon, applyCoupon, removeCoupon } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const navigate = useNavigate();

  const FREE_SHIPPING_THRESHOLD = 5000;
  const progress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const remaining = FREE_SHIPPING_THRESHOLD - subtotal;

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    const success = applyCoupon(couponCode);
    if (!success) {
      setCouponError('Invalid coupon code');
    } else {
      setCouponError('');
      setCouponCode('');
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md flex flex-col bg-white">
        <SheetHeader className="border-b border-gray-100 pb-4">
          <SheetTitle className="font-display text-2xl font-bold flex items-center gap-2">
            Shopping Cart <span className="text-gray-400 text-lg font-normal">({items.length})</span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-6 -mx-6 px-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                <ShoppingBag className="h-10 w-10 text-gray-300" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-gray-900 mb-1">Your cart is empty</h3>
                <p className="text-gray-500">Looks like you haven't added anything yet.</p>
              </div>
              <Button
                onClick={() => document.querySelector('[data-radix-collection-item]')?.dispatchEvent(new Event('click'))}
                className="mt-4 bg-coral-400 hover:bg-coral-500 text-white"
              >
                Start Shopping
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Free Shipping Progress */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
                  <Truck className="w-4 h-4 text-coral-500" />
                  {remaining > 0 ? (
                    <span>Spend <span className="text-coral-500">₹{remaining.toFixed(0)}</span> more for free shipping</span>
                  ) : (
                    <span className="text-green-600">You've unlocked Free Shipping!</span>
                  )}
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-coral-400 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`} className="flex gap-4 group">
                    <div className="w-24 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.product.image || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800"}
                        alt={item.product.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-gray-900 line-clamp-1">{item.product.name}</h4>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-500 mt-1 capitalize">
                          {item.selectedColor} • {item.selectedSize}
                        </p>
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                          <button
                            onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                            className="w-6 h-6 flex items-center justify-center rounded-md bg-white shadow-sm hover:text-coral-500 transition-colors disabled:opacity-50"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center rounded-md bg-white shadow-sm hover:text-coral-500 transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="font-medium text-gray-900">₹{(item.product.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-gray-100 pt-6 space-y-4 bg-white">
            {/* Coupon Code */}
            <div className={`transition-all duration-300 ${coupon ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex gap-2">
                <Input
                  placeholder="Promo Code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="bg-gray-50 border-gray-200"
                />
                <Button variant="outline" onClick={handleApplyCoupon} className="whitespace-nowrap">
                  Apply
                </Button>
              </div>
              {couponError && <p className="text-xs text-red-500 mt-1">{couponError}</p>}
            </div>

            {coupon && (
              <div className="flex items-center justify-between bg-green-50 px-3 py-2 rounded-lg border border-green-100">
                <div className="text-sm text-green-700">
                  <span className="font-medium">Coupon applied:</span> {coupon.code}
                </div>
                <button onClick={removeCoupon} className="text-green-700 hover:text-green-800">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-gray-900">₹{subtotal.toFixed(2)}</span>
              </div>
              {coupon && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-₹{(subtotal * (coupon.discountValue / 100)).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-gray-900">{remaining > 0 ? '₹99.00' : 'FREE'}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-100">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>

            <Button
              className="w-full bg-coral-400 hover:bg-coral-500 text-white py-6 text-lg font-medium"
            >
              Proceed to Checkout
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
