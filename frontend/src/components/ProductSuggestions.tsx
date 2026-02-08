import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api, API_URL } from '@/lib/api';
import type { Product } from '@/data/products';

interface ProductSuggestionsProps {
  currentProduct: Product;
  category: string;
}

export default function ProductSuggestions({ currentProduct, category }: ProductSuggestionsProps) {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuggestions();
  }, [currentProduct.id, category]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      // Fetch random suggestions from new API
      const response = await api.get('/products/suggestions/list');
      // Handle both direct data and wrapped response formats
      const allProducts = response.data || response || [];

      const backendUrl = API_URL;
      const baseUrl = backendUrl.replace('/api', '');

      const mappedProducts = allProducts.map((p: any) => {
        const images = p.images?.map((img: any) => {
          const url = typeof img === 'string' ? img : img.url;
          return url.startsWith('http') ? url : `${baseUrl}${url}`;
        }) || [];

        return {
          ...p,
          images: images
        };
      });

      // Filter out current product just in case random includes it
      const filteredProducts = mappedProducts.filter((p: Product) => p.id !== currentProduct.id);
      setSuggestions(filteredProducts);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleProductClick = (product: Product) => {
    navigate(`/product/${product.id}`);
  };

  if (loading) {
    return (
      <div className="py-12">
        <h2 className="text-2xl font-bold mb-8">You Might Also Like</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-muted rounded-lg mb-3"></div>
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="py-12 border-t">
      <h2 className="text-2xl font-bold mb-8">You Might Also Like</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {suggestions.map((product) => (
          <div
            key={product.id}
            className="group cursor-pointer"
            onClick={() => handleProductClick(product)}
          >
            <div className="aspect-square bg-muted rounded-lg overflow-hidden mb-3 relative">
              <img
                src={product.images?.[0] || ''}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {(product as any).onSale && (
                <Badge variant="destructive" className="absolute top-2 left-2 text-xs">
                  {Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)}% OFF
                </Badge>
              )}
            </div>
            <h3 className="font-medium text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <div className="flex items-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${i < Math.floor(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                    }`}
                />
              ))}
              <span className="text-xs text-muted-foreground">({product.reviews})</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm">{formatPrice(product.price)}</span>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <ShoppingBag className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}