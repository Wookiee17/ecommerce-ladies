import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Upload } from 'lucide-react';

interface VirtualTryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    images?: (string | { url?: string; isPrimary?: boolean })[];
    category: string;
  };
}

export default function VirtualTryOnModal({ isOpen, onClose, product }: VirtualTryOnModalProps) {
  const [userImage, setUserImage] = useState<File | null>(null);
  const [userImageUrl, setUserImageUrl] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUserImage(file);
      setUserImageUrl(URL.createObjectURL(file));
      setGeneratedImage(null);
      setError(null);
    }
  };

  const handleVirtualTryOn = async () => {
    if (!userImage || !product) return;

    setIsLoading(true);
    setGeneratedImage(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('userImage', userImage);
      if (product.images && product.images[0]) {
        // Handle both object format {url, isPrimary} and string format
        const firstImage = product.images[0];
        const imageUrl = typeof firstImage === 'string' ? firstImage : firstImage?.url || '';
        formData.append('productImage', imageUrl);
      }
      formData.append('prompt', constructPrompt(product.category));
      formData.append('temperature', '0.4');

      const token = localStorage.getItem('evara_token');
      // Import API_URL if not available, or standard hardcode fallback for now to avoid import diagnosis issues if not exported
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      const response = await fetch(`${API_URL}/try-on/virtual-try-on`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          // Content-Type must strictly NOT be set when sending FormData, browser sets it with boundary
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to generate image');
      }

      const imageBlob = await response.blob();
      const imageUrl = URL.createObjectURL(imageBlob);
      setGeneratedImage(imageUrl);

    } catch (err) {
      setError('Failed to generate virtual try-on image. Please try again.');
      console.error('Virtual try-on failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const constructPrompt = (category: string) => {
    const basePrompt = `You are an expert virtual try-on AI assistant.
Task: Generate a highly realistic image of the person from the first image wearing the product shown in the second image.
Strict Guidelines:
Identity Preservation: You must strictly preserve the user's face, hair, skin tone, and body shape. Do not alter their identity.
Product Application:`;

    const clothingPrompt = `If the product is Clothing: Replace the user's current outfit with the new product. Ensure realistic fabric folds, draping, and fit based on the user's pose.
Ensure the fabric texture is visible and wraps naturally around the body.`;

    const jewelryPrompt = `If the product is Jewelry: Place the item accurately (e.g., necklace around the neck, earrings on earlobes) with correct scale and perspective.
Pay special attention to the reflection and sparkle of the metal/stones matching the room's light.`;

    const lightingIntegration = `Lighting & Integration: Match the lighting, shadows, and color temperature of the product to the user's original environment so it looks like a single photograph, not a photoshop cut-out.
Output: Return only the final image.`;

    let productSpecificPrompt = '';
    if (category.toLowerCase().includes('clothing') || category.toLowerCase().includes('shirt') || category.toLowerCase().includes('dress')) {
      productSpecificPrompt = clothingPrompt;
    } else if (category.toLowerCase().includes('jewelry') || category.toLowerCase().includes('necklace') || category.toLowerCase().includes('earring')) {
      productSpecificPrompt = jewelryPrompt;
    }

    return `${basePrompt}\n${productSpecificPrompt}\n${lightingIntegration}`;
  };

  const resetState = () => {
    setUserImage(null);
    setUserImageUrl(null);
    setGeneratedImage(null);
    setIsLoading(false);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetState}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Virtual Try-On</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
          <div className="flex flex-col items-center justify-center space-y-4">
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
                Upload Image
              </label>
            </Button>
          </div>
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
              {isLoading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="h-12 w-12 text-white animate-spin" />
                </div>
              )}
              {generatedImage ? (
                <img src={generatedImage} alt="Try-On Result" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-muted-foreground">
                  <p>Your try-on result will appear here</p>
                </div>
              )}
            </div>
            <div className="w-full text-center text-sm text-destructive">{error}</div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={resetState} variant="outline">Cancel</Button>
          <Button onClick={handleVirtualTryOn} disabled={!userImage || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Try-On'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
