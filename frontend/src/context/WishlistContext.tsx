import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Product } from '@/data/products';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { useCart } from '@/context/CartContext';

interface WishlistContextType {
  wishlist: Product[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  moveToCart: (product: Product) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  // Fetch wishlist on login
  useEffect(() => {
    if (isAuthenticated) {
      const fetchWishlist = async () => {
        try {
          const response = await api.get('/wishlist');
          if (response.data && Array.isArray(response.data)) {
            setWishlist(response.data.map((item: any) => ({
              ...item,
              id: item._id, // Map _id
              image: item.images?.[0]?.url || item.image
            })));
          }
        } catch (error) {
          console.error("Failed to fetch wishlist:", error);
        }
      };
      fetchWishlist();
    } else {
      setWishlist([]);
    }
  }, [isAuthenticated]);

  const addToWishlist = useCallback((product: Product) => {
    setWishlist(prevItems => {
      if (prevItems.some(item => item.id === product.id)) {
        return prevItems;
      }
      return [...prevItems, product];
    });
  }, []);

  const removeFromWishlist = useCallback((productId: string) => {
    setWishlist(prevItems => prevItems.filter(item => item.id !== productId));
  }, []);

  const toggleWishlist = useCallback(async (product: Product) => {
    const isAdding = !wishlist.some(item => item.id === product.id);

    setWishlist(prevItems => {
      const exists = prevItems.some(item => item.id === product.id);
      if (exists) {
        return prevItems.filter(item => item.id !== product.id);
      }
      return [...prevItems, product];
    });

    if (isAuthenticated) {
      try {
        if (isAdding) {
          await api.post('/wishlist/add', { productId: product.id });
        } else {
          await api.delete(`/wishlist/${product.id}`);
        }
      } catch (error) {
        console.error("Failed to update wishlist backend:", error);
      }
    }
  }, [isAuthenticated, wishlist]);

  const isInWishlist = useCallback((productId: string) => {
    return wishlist.some(item => item.id === productId);
  }, [wishlist]);

  const clearWishlist = useCallback(() => {
    setWishlist([]);
  }, []);

  const moveToCart = useCallback((product: Product) => {
    addToCart(product);
    removeFromWishlist(product.id);
  }, [addToCart, removeFromWishlist]);

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
        clearWishlist,
        moveToCart,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
