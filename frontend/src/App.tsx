import { Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { CategoryProvider } from '@/context/CategoryContext';
import { AuthProvider } from '@/context/AuthContext';
import { SearchProvider } from '@/context/SearchContext';
import Navigation from '@/components/Navigation';
import CartDrawer from '@/components/CartDrawer';
import WishlistDrawer from '@/components/WishlistDrawer';
import AuthModal from '@/components/AuthModal';
import ImageSearch from '@/components/ImageSearch';
import PromotionalModal from '@/components/PromotionalModal';
import HomePage from '@/pages/HomePage';
import ProductsPage from '@/pages/ProductsPage';
import ProductPage from '@/pages/ProductPage';
import ProfilePage from '@/pages/ProfilePage';
import AdminDashboard from '@/pages/AdminDashboard';
import SellerDashboard from '@/pages/SellerDashboard';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import type { Product } from '@/data/products';

function AppContent() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isImageSearchOpen, setIsImageSearchOpen] = useState(false);
  const [imageSearchResults, setImageSearchResults] = useState<Product[] | null>(null);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('evara_token');
    const dismissed = localStorage.getItem('promoModalDismissed');

    // Show promo modal if user is not logged in and hasn't dismissed it recently
    if (!token && !dismissed) {
      setIsPromoModalOpen(true);
    }
  }, []);

  const handleImageSearchResults = (results: Product[]) => {
    setImageSearchResults(results);
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">
      <Navigation
        onCartClick={() => setIsCartOpen(true)}
        onWishlistClick={() => setIsWishlistOpen(true)}
        onAuthClick={() => setIsAuthOpen(true)}
        onImageSearchClick={() => setIsImageSearchOpen(true)}
      />

      <main>
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                imageSearchResults={imageSearchResults}
                onImageSearchResults={handleImageSearchResults}
              />
            }
          />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/seller/dashboard" element={
            <ProtectedRoute allowedRoles={['seller']}>
              <SellerDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </main>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <WishlistDrawer isOpen={isWishlistOpen} onClose={() => setIsWishlistOpen(false)} />
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
      <ImageSearch
        isOpen={isImageSearchOpen}
        onClose={() => setIsImageSearchOpen(false)}
        onResults={handleImageSearchResults}
      />
      <PromotionalModal
        isOpen={isPromoModalOpen}
        onClose={() => setIsPromoModalOpen(false)}
        onSignupSuccess={() => setIsAuthOpen(true)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CategoryProvider>
        <SearchProvider>
          <CartProvider>
            <WishlistProvider>
              <AppContent />
            </WishlistProvider>
          </CartProvider>
        </SearchProvider>
      </CategoryProvider>
    </AuthProvider>
  );
}