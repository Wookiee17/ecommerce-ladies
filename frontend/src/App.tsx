import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { CategoryProvider, useCategory } from '@/context/CategoryContext';
import { AuthProvider } from '@/context/AuthContext';
import { SearchProviderFixed } from '@/context/SearchContext';
import Navigation from '@/components/Navigation';
import CartDrawer from '@/components/CartDrawer';
import WishlistDrawer from '@/components/WishlistDrawer';
import ProductDetail from '@/components/ProductDetail';
import AuthModal from '@/components/AuthModal';
import PromotionalModal from '@/components/PromotionalModal';
import ImageSearch from '@/components/ImageSearch';
import Hero from '@/sections/Hero';
import Categories from '@/sections/Categories';
import Products from '@/sections/Products';
import Features from '@/sections/Features';
import Newsletter from '@/sections/Newsletter';
import Footer from '@/sections/Footer';
import ProductsPage from '@/pages/ProductsPage';
import type { Product } from '@/data/products';
import './App.css';

// Home Page Component
function HomePage() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isImageSearchOpen, setIsImageSearchOpen] = useState(false);
  const [imageSearchResults, setImageSearchResults] = useState<Product[] | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);

  const { getBackgroundClass } = useCategory();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const dismissed = localStorage.getItem('promoModalDismissed');

    // Show promo modal if user is not logged in and hasn't dismissed it recently
    if (!token && !dismissed) {
      setIsPromoModalOpen(true);
    }
  }, []);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsProductDetailOpen(true);
  };

  const handleImageSearchResults = (results: Product[]) => {
    setImageSearchResults(results);
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${getBackgroundClass()}`}>
      <Navigation
        onCartClick={() => setIsCartOpen(true)}
        onWishlistClick={() => setIsWishlistOpen(true)}
        onAuthClick={() => setIsAuthOpen(true)}
        onImageSearchClick={() => setIsImageSearchOpen(true)}
      />

      <main>
        <Hero />
        <Categories />
        <Products
          onProductClick={handleProductClick}
          imageSearchResults={imageSearchResults}
        />
        <Features />
        <Newsletter />
      </main>

      <Footer />

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <WishlistDrawer isOpen={isWishlistOpen} onClose={() => setIsWishlistOpen(false)} />
      <ProductDetail
        product={selectedProduct}
        isOpen={isProductDetailOpen}
        onClose={() => setIsProductDetailOpen(false)}
      />
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
        onSignupSuccess={() => {
          setIsPromoModalOpen(false);
          setIsAuthOpen(false);
        }}
      />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SearchProviderFixed>
          <CartProvider>
            <WishlistProvider>
              <CategoryProvider>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </CategoryProvider>
            </WishlistProvider>
          </CartProvider>
        </SearchProviderFixed>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
