import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface GeneratedImage {
  productId: string;
  url: string;
  generatedAt: string;
}

interface RateLimit {
  allowed: boolean;
  remaining: number;
  resetAt: string;
}

interface TryOnContextType {
  // User photo
  userPhotoUrl: string | null;
  hasPhoto: boolean;
  uploadUserPhoto: (file: File) => Promise<boolean>;
  deleteUserPhoto: () => Promise<boolean>;
  
  // Generated images
  generatedImages: GeneratedImage[];
  getProductTryOnImage: (productId: string) => string | null;
  
  // Generation
  generateTryOn: (productId: string) => Promise<boolean>;
  generateForFirstTen: () => Promise<{ success: boolean; generatedCount: number; message: string }>;
  
  // Rate limiting
  rateLimit: RateLimit | null;
  checkRateLimit: () => Promise<RateLimit | null>;
  
  // Loading states
  loading: boolean;
  generatingProductId: string | null;
  error: string | null;
}

const TryOnContext = createContext<TryOnContextType | undefined>(undefined);

export const TryOnProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  // State
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [rateLimit, setRateLimit] = useState<RateLimit | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatingProductId, setGeneratingProductId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's try-on data on mount (if authenticated)
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserTryOnData();
    }
  }, [isAuthenticated]);

  // Fetch user try-on data from backend
  const fetchUserTryOnData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/try-on-v2/user-data');
      
      if (response.data?.success) {
        const data = response.data.data;
        setHasPhoto(data.hasPhoto);
        setUserPhotoUrl(data.userPhotoUrl || null);
        setGeneratedImages(data.generatedImages || []);
        setRateLimit(data.rateLimit);
      }
    } catch (err: any) {
      console.error('Failed to fetch try-on data:', err);
      // Don't show error to user for initial fetch
    } finally {
      setLoading(false);
    }
  };

  // Upload user photo
  const uploadUserPhoto = useCallback(async (file: File): Promise<boolean> => {
    if (!isAuthenticated) {
      setError('Please sign in to upload your photo');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('userImage', file);

      const response = await api.post('/try-on-v2/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data?.success) {
        setHasPhoto(true);
        setUserPhotoUrl(response.data.data.imageUrl);
        // Clear previous generations when photo changes
        setGeneratedImages([]);
        return true;
      } else {
        setError(response.data?.message || 'Failed to upload photo');
        return false;
      }
    } catch (err: any) {
      console.error('Upload photo error:', err);
      setError(err.response?.data?.message || 'Failed to upload photo');
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Delete user photo
  const deleteUserPhoto = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      setLoading(true);
      const response = await api.delete('/try-on-v2/photo');
      
      if (response.data?.success) {
        setHasPhoto(false);
        setUserPhotoUrl(null);
        setGeneratedImages([]);
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Delete photo error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Get try-on image for specific product
  const getProductTryOnImage = useCallback((productId: string): string | null => {
    const generated = generatedImages.find(g => g.productId === productId);
    return generated?.url || null;
  }, [generatedImages]);

  // Check rate limit
  const checkRateLimit = useCallback(async (): Promise<RateLimit | null> => {
    if (!isAuthenticated) return null;

    try {
      const response = await api.get('/try-on-v2/rate-limit');
      if (response.data?.success) {
        setRateLimit(response.data.data);
        return response.data.data;
      }
    } catch (err) {
      console.error('Check rate limit error:', err);
    }
    return null;
  }, [isAuthenticated]);

  // Generate try-on for a product
  const generateTryOn = useCallback(async (productId: string): Promise<boolean> => {
    if (!isAuthenticated) {
      setError('Please sign in to generate try-ons');
      return false;
    }

    if (!hasPhoto) {
      setError('Please upload your photo first');
      return false;
    }

    // Check if already generated
    if (getProductTryOnImage(productId)) {
      return true; // Already exists
    }

    try {
      setGeneratingProductId(productId);
      setError(null);

      const response = await api.post('/try-on-v2/generate', { productId });

      if (response.data?.success) {
        // Add to generated images
        setGeneratedImages(prev => [...prev, {
          productId,
          url: response.data.data.generatedImageUrl,
          generatedAt: new Date().toISOString()
        }]);
        
        // Update rate limit
        setRateLimit(prev => prev ? {
          ...prev,
          remaining: response.data.data.remainingGenerations
        } : null);
        
        return true;
      } else {
        setError(response.data?.message || 'Failed to generate try-on');
        return false;
      }
    } catch (err: any) {
      console.error('Generate try-on error:', err);
      
      // Handle rate limit error
      if (err.response?.status === 429) {
        const resetAt = err.response.data?.data?.resetAt;
        const minutes = resetAt ? Math.ceil((new Date(resetAt).getTime() - Date.now()) / 60000) : 10;
        setError(`Rate limit exceeded. Try again in ${minutes} minutes.`);
      } else {
        setError(err.response?.data?.message || 'Failed to generate try-on');
      }
      
      return false;
    } finally {
      setGeneratingProductId(null);
    }
  }, [isAuthenticated, hasPhoto, getProductTryOnImage]);

  // Generate for first 10 products
  const generateForFirstTen = useCallback(async (): Promise<{ success: boolean; generatedCount: number; message: string }> => {
    if (!isAuthenticated) {
      return { success: false, generatedCount: 0, message: 'Please sign in' };
    }

    if (!hasPhoto) {
      return { success: false, generatedCount: 0, message: 'Please upload your photo first' };
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/try-on-v2/generate-first-ten', {});

      if (response.data?.success) {
        // Refresh data to get updated list
        await fetchUserTryOnData();
        
        const generatedCount = response.data.data.results.filter((r: any) => r.status === 'generated').length;
        return { 
          success: true, 
          generatedCount,
          message: `Generated ${generatedCount} try-on images for the first 10 products`
        };
      } else {
        return { success: false, generatedCount: 0, message: response.data?.message || 'Failed to generate' };
      }
    } catch (err: any) {
      console.error('Generate first ten error:', err);
      
      if (err.response?.status === 429) {
        const resetAt = err.response.data?.data?.resetAt;
        const minutes = resetAt ? Math.ceil((new Date(resetAt).getTime() - Date.now()) / 60000) : 10;
        return { success: false, generatedCount: 0, message: `Rate limit exceeded. Try again in ${minutes} minutes.` };
      }
      
      return { success: false, generatedCount: 0, message: err.response?.data?.message || 'Failed to generate' };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, hasPhoto]);

  return (
    <TryOnContext.Provider value={{
      userPhotoUrl,
      hasPhoto,
      uploadUserPhoto,
      deleteUserPhoto,
      generatedImages,
      getProductTryOnImage,
      generateTryOn,
      generateForFirstTen,
      rateLimit,
      checkRateLimit,
      loading,
      generatingProductId,
      error
    }}>
      {children}
    </TryOnContext.Provider>
  );
};

export const useTryOn = () => {
  const context = useContext(TryOnContext);
  if (!context) {
    throw new Error('useTryOn must be used within a TryOnProvider');
  }
  return context;
};
