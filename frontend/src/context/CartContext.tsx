import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Product } from '@/data/products';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, selectedColor?: string, selectedSize?: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  isInCart: (productId: string) => boolean;
  coupon: Coupon | null;
  subtotal: number;
  total: number;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState<Coupon | null>(null);

  const { isAuthenticated } = useAuth();

  // Fetch cart from backend on login
  useEffect(() => {
    if (isAuthenticated) {
      const fetchCart = async () => {
        try {
          const response = await api.get('/cart');
          if (response.data && Array.isArray(response.data.items)) {
            // Transform backend cart items to frontend format if needed
            setItems(response.data.items.map((item: any) => ({
              product: {
                ...item.product,
                id: item.product._id, // Map _id to id
                image: item.product.images?.[0]?.url || item.product.image
              },
              quantity: item.quantity,
              selectedColor: item.selectedColor,
              selectedSize: item.selectedSize
            })));
          }
        } catch (error) {
          console.error('Failed to fetch cart:', error);
        }
      };
      fetchCart();
    } else {
      // Optionally clear or keep local cart
      setItems([]);
    }
  }, [isAuthenticated]);

  const addToCart = useCallback(async (product: Product, quantity = 1, selectedColor?: string, selectedSize?: string) => {
    // Optimistic update
    setItems(prevItems => {
      const existingItem = prevItems.find(item =>
        item.product.id === product.id &&
        item.selectedColor === selectedColor &&
        item.selectedSize === selectedSize
      );

      if (existingItem) {
        return prevItems.map(item =>
          item.product.id === product.id &&
            item.selectedColor === selectedColor &&
            item.selectedSize === selectedSize
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevItems, { product, quantity, selectedColor, selectedSize }];
    });

    if (isAuthenticated) {
      try {
        await api.post('/cart/add', {
          productId: product.id, // Ensure using 'id' which maps to _id
          quantity,
          selectedColor,
          selectedSize
        });
      } catch (error) {
        console.error('Failed to add to cart backend:', error);
        // Revert on failure? For now, just log.
      }
    }
  }, [isAuthenticated]);

  const removeFromCart = useCallback((productId: string) => {
    setItems(prevItems => prevItems.filter(item => item.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems(prevItems =>
      prevItems.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getCartTotal = useCallback(() => {
    return items.reduce((total, item) => total + item.product.price * item.quantity, 0);
  }, [items]);

  const getCartCount = useCallback(() => {
    return items.reduce((count, item) => count + item.quantity, 0);
  }, [items]);

  const isInCart = useCallback((productId: string) => {
    return items.some(item => item.product.id === productId);
  }, [items]);

  const subtotal = getCartTotal();
  const total = coupon
    ? coupon.discountType === 'percentage'
      ? subtotal * (1 - coupon.discountValue / 100)
      : Math.max(0, subtotal - coupon.discountValue)
    : subtotal;

  const applyCoupon = async (code: string) => {
    // Mock coupon logic for now
    if (code === 'SAVE10') {
      setCoupon({ code, discountType: 'percentage', discountValue: 10 });
    } else {
      throw new Error('Invalid coupon');
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
        isInCart,
        coupon,
        subtotal,
        total,
        applyCoupon,
        removeCoupon
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
