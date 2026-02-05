import { Plus, Minus, ShoppingBag, Trash2, ArrowRight, Tag, X } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useCoupons } from '@/hooks/useCoupons';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CouponCard from '@/components/CouponCard';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
  const { coupons, validateCoupon } = useCoupons();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [showCoupons, setShowCoupons] = useState(false);

  const cartTotal = getCartTotal();
  const shipping = cartTotal >= 999 ? 0 : 99;
  const subtotal = cartTotal;

  // Calculate discount
  const discount = appliedCoupon ?
    (appliedCoupon.discountType === 'percentage' ?
      (subtotal * appliedCoupon.discountValue) / 100 :
      appliedCoupon.discountValue) : 0;

  const finalTotal = subtotal + shipping - discount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setCouponError('');
    const validation = await validateCoupon(couponCode, cartTotal);

    if (validation.valid) {
      setAppliedCoupon(validation.data.coupon);
      setCouponCode('');
    } else {
      setCouponError(validation.message);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
  };

  const handleApplyCouponFromCard = (code: string) => {
    setCouponCode(code);
    handleApplyCoupon();
    setShowCoupons(false);
  };
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Shopping Cart ({items.length})
            </SheetTitle>
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-sm text-gray-500 hover:text-red-500 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <ShoppingBag className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="font-display text-xl font-semibold text-gray-900 mb-2">
              Your cart is empty
            </h3>
            <p className="text-gray-500 mb-6">
              Looks like you haven&apos;t added anything to your cart yet.
            </p>
            <Button onClick={onClose} className="bg-coral-400 hover:bg-coral-500 text-white">
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {items.map((item) => (
                <div
                  key={`${item.product.id}-${item.selectedColor}-${item.selectedSize}`}
                  className="flex gap-4 p-4 bg-gray-50 rounded-xl"
                >
                  {/* Image */}
                  <div className="w-20 h-24 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {item.product.name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {item.selectedColor && `${item.selectedColor}`}
                      {item.selectedColor && item.selectedSize && ' / '}
                      {item.selectedSize && `${item.selectedSize}`}
                    </p>
                    <p className="font-semibold text-gray-900 mt-1">
                      {formatPrice(item.product.price)}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity - 1)
                          }
                          className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:border-coral-400 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity + 1)
                          }
                          className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:border-coral-400 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary */}
            <div className="border-t pt-4 space-y-4">
              {/* Subtotal */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatPrice(getCartTotal())}</span>
              </div>

              {/* Shipping */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className="text-green-600">
                  {getCartTotal() >= 999 ? 'Free' : formatPrice(99)}
                </span>
              </div>

              {/* Total */}
              <div className="flex justify-between text-lg font-semibold border-t pt-4">
                <span>Total</span>
                <span>
                  {formatPrice(finalTotal)}
                </span>
              </div>

              {/* Coupon Section */}
              {!appliedCoupon && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleApplyCoupon}
                      variant="outline"
                      size="sm"
                      className="px-4"
                    >
                      Apply
                    </Button>
                  </div>

                  {couponError && (
                    <p className="text-sm text-red-500">{couponError}</p>
                  )}

                  {coupons.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCoupons(!showCoupons)}
                      className="text-purple-600 hover:text-purple-700 p-0 h-auto"
                    >
                      <Tag className="w-4 h-4 mr-1" />
                      View Available Coupons ({coupons.length})
                    </Button>
                  )}
                </div>
              )}

              {/* Applied Coupon */}
              {appliedCoupon && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-green-800">
                        {appliedCoupon.code} applied
                      </p>
                      <p className="text-sm text-green-600">
                        -{formatPrice(discount)} discount
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveCoupon}
                      className="text-red-500 hover:text-red-700 p-1 h-auto"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Available Coupons */}
              {showCoupons && coupons.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {coupons.map((coupon) => (
                    <CouponCard
                      key={coupon._id}
                      {...coupon}
                      onApply={handleApplyCouponFromCard}
                    />
                  ))}
                </div>
              )}

              {/* Checkout Button */}
              <Button
                className="w-full bg-coral-400 hover:bg-coral-500 text-white py-6 text-lg font-medium"
              >
                Proceed to Checkout
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              {/* Continue Shopping */}
              <button
                onClick={onClose}
                className="w-full text-center text-gray-500 hover:text-coral-400 transition-colors text-sm"
              >
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
