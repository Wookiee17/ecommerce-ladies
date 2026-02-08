import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, Check } from 'lucide-react';
import { useTryOn } from '@/context/TryOnContext';

interface VirtualTryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    _id?: string;  // MongoDB ID from API
    name: string;
    images?: (string | { url?: string; isPrimary?: boolean })[];
    category: string;
  };
}

export default function VirtualTryOnModal({ isOpen, onClose, product }: VirtualTryOnModalProps) {
  const [userImage, setUserImage] = useState<File | null>(null);
  const [userImageUrl, setUserImageUrl] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [started, setStarted] = useState(false);
  const [description, setDescription] = useState('');

  const { startBackgroundTryOn, getProductTryOnImage } = useTryOn();

  // Check if already have a try-on image for this product
  const existingTryOnImage = getProductTryOnImage(product.id);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUserImage(file);
      setUserImageUrl(URL.createObjectURL(file));
      setStarted(false);
    }
  };

  const handleStartTryOn = () => {
    if (!userImage || !product) return;

    setIsStarting(true);

    // Get product image URL
    let productImageUrl = '';
    if (product.images && product.images[0]) {
      const firstImage = product.images[0];
      productImageUrl = typeof firstImage === 'string' ? firstImage : firstImage?.url || '';
    }

    // Start background processing
    const finalDescription = description.trim()
      ? `A stylish garment for virtual try-on. ${description.trim()}`
      : "A stylish garment for virtual try-on";

    startBackgroundTryOn((product._id || product.id) as string, product.name, productImageUrl, userImage, finalDescription);

    // Show confirmation and close after a brief delay
    setStarted(true);
    setIsStarting(false);

    setTimeout(() => {
      resetState();
    }, 1500);
  };

  const resetState = () => {
    setUserImage(null);
    setUserImageUrl(null);
    setIsStarting(false);
    setStarted(false);
    onClose();
  };

  // Get product image for display
  const productImageUrl = (() => {
    if (!product.images || product.images.length === 0) return '';
    const firstImage = product.images[0];
    const url = typeof firstImage === 'string' ? firstImage : firstImage?.url || '';
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const baseUrl = backendUrl.replace('/api', '');
    return url.startsWith('http') ? url : `${baseUrl}${url}`;
  })();

  return (
    <Dialog open={isOpen} onOpenChange={resetState}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Virtual Try-On</DialogTitle>
        </DialogHeader>

        {started ? (
          // Success state
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Try-On Started!</h3>
            <p className="text-gray-500 text-center max-w-md">
              We're generating your try-on image in the background.
              You'll receive a notification when it's ready. Feel free to continue browsing!
            </p>
          </div>
        ) : existingTryOnImage ? (
          // Show existing try-on image
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <p className="text-sm text-muted-foreground mb-4">Your virtual try-on for this product:</p>
            <div className="w-full max-w-md aspect-square bg-muted rounded-lg overflow-hidden">
              <img src={existingTryOnImage} alt="Try-On Result" className="w-full h-full object-cover" />
            </div>
            <Button onClick={() => {
              setUserImage(null);
              setUserImageUrl(null);
            }} variant="outline">
              Generate New Try-On
            </Button>
          </div>
        ) : (
          // Upload state
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
            {/* User Image Upload */}
            <div className="flex flex-col items-center justify-center space-y-4">
              <p className="text-sm font-medium text-gray-700">Your Photo</p>
              <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                {userImageUrl ? (
                  <img src={userImageUrl} alt="Your" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Upload className="mx-auto h-12 w-12" />
                    <p>Upload your photo</p>
                  </div>
                )}
              </div>
              <input
                type="file"
                id="user-image-upload"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
              <Button asChild variant="outline">
                <label htmlFor="user-image-upload">
                  <Upload className="mr-2 h-4 w-4" />
                  {userImageUrl ? 'Change Photo' : 'Upload Photo'}
                </label>
              </Button>
            </div>

            {/* Product Image Preview */}
            <div className="flex flex-col items-center justify-center space-y-4">
              <p className="text-sm font-medium text-gray-700">Product: {product.name}</p>
              <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                {productImageUrl ? (
                  <img src={productImageUrl} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <p>No product image</p>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground text-center">
                The AI will generate you wearing this item
              </p>
            </div>
          </div>
        )}

        {/* Styling Notes Input */}
        {!started && !existingTryOnImage && (
          <div className="px-6 mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Styling Notes (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="E.g., Tuck in the shirt, wear on left arm, roll up sleeves..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Help the AI understand how you want to wear this item.
            </p>
          </div>
        )}

        {!started && !existingTryOnImage && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mx-6 mb-4">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> Generation takes 1-2 minutes. You'll receive a notification when it's ready,
              and can continue browsing in the meantime.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button onClick={resetState} variant="outline">
            {started ? 'Close' : 'Cancel'}
          </Button>
          {!started && !existingTryOnImage && (
            <Button onClick={handleStartTryOn} disabled={!userImage || isStarting}>
              {isStarting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                'Start Try-On'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog >
  );
}
