import Hero from '@/sections/Hero';
import Categories from '@/sections/Categories';
import Products from '@/sections/Products';
import Features from '@/sections/Features';
import Newsletter from '@/sections/Newsletter';
import { useNavigate } from 'react-router-dom';
import type { Product } from '@/data/products';

interface HomePageProps {
  imageSearchResults: Product[] | null;
  onImageSearchResults: (results: Product[]) => void;
}

export default function HomePage({ imageSearchResults }: HomePageProps) {
  const navigate = useNavigate();

  const handleProductClick = (product: Product) => {
    navigate(`/product/${product.id}`);
  };

  return (
    <>
      <Hero />
      <Categories />
      <Products
        onProductClick={handleProductClick}
        imageSearchResults={imageSearchResults}
      />
      <Features />
      <Newsletter />
    </>
  );
}