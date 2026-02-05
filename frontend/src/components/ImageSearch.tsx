import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Search, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { products, type Product } from '@/data/products';

interface ImageSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onResults: (results: Product[]) => void;
}

export default function ImageSearch({ isOpen, onClose, onResults }: ImageSearchProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Simple color extraction for image similarity
  const extractColorFeatures = (img: HTMLImageElement): number[] => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

    canvas.width = 50;
    canvas.height = 50;
    ctx.drawImage(img, 0, 0, 50, 50);

    const imageData = ctx.getImageData(0, 0, 50, 50);
    const data = imageData.data;

    // Calculate average RGB and color histogram
    let r = 0, g = 0, b = 0;
    const colorBins = new Array(8).fill(0).map(() => new Array(8).fill(0).map(() => new Array(8).fill(0)));

    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];

      const binR = Math.floor(data[i] / 32);
      const binG = Math.floor(data[i + 1] / 32);
      const binB = Math.floor(data[i + 2] / 32);
      colorBins[binR][binG][binB]++;
    }

    const pixelCount = data.length / 4;
    const features = [
      r / pixelCount / 255,
      g / pixelCount / 255,
      b / pixelCount / 255,
      ...colorBins.flat(2).map(v => v / pixelCount)
    ];

    return features;
  };

  // Calculate similarity between two feature vectors
  const calculateSimilarity = (features1: number[], features2: number[]): number => {
    if (features1.length !== features2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < features1.length; i++) {
      dotProduct += features1[i] * features2[i];
      norm1 += features1[i] * features1[i];
      norm2 += features2[i] * features2[i];
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  };

  const analyzeImage = useCallback(async (imageSrc: string) => {
    setIsAnalyzing(true);

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageSrc;
      });

      const queryFeatures = extractColorFeatures(img);

      // Compare with all product images
      const similarityPromises = products.map(async (product) => {
        try {
          const productImg = new Image();
          productImg.crossOrigin = 'anonymous';
          
          await new Promise((resolve, reject) => {
            productImg.onload = resolve;
            productImg.onerror = reject;
            productImg.src = product.image;
          });

          const productFeatures = extractColorFeatures(productImg);
          const similarity = calculateSimilarity(queryFeatures, productFeatures);

          return { product, similarity };
        } catch {
          return { product, similarity: 0 };
        }
      });

      const results = await Promise.all(similarityPromises);
      
      // Sort by similarity and filter results
      const sortedResults = results
        .filter(r => r.similarity > 0.5)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 8)
        .map(r => r.product);

      if (sortedResults.length === 0) {
        // If no strong matches, return products from similar categories
        const categoryMatches = products.filter(p => 
          p.category === 'dress' || p.category === 'beauty'
        ).slice(0, 8);
        onResults(categoryMatches);
        toast.info('No exact matches found. Showing similar products.');
      } else {
        onResults(sortedResults);
        toast.success(`Found ${sortedResults.length} similar products!`);
      }

      onClose();
    } catch (error) {
      toast.error('Failed to analyze image. Please try again.');
    } finally {
      setIsAnalyzing(false);
      setSelectedImage(null);
    }
  }, [onClose, onResults]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setSelectedImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch {
      toast.error('Could not access camera. Please check permissions.');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        setSelectedImage(canvas.toDataURL('image/jpeg'));
      }
      
      // Stop camera
      const stream = videoRef.current.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-coral-400" />
            Search by Image
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!selectedImage && !isCameraActive && (
            <>
              {/* Upload Area */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  dragActive
                    ? 'border-coral-400 bg-coral-50'
                    : 'border-gray-300 hover:border-coral-400 hover:bg-gray-50'
                }`}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700">
                  Drag & drop an image
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  or click to browse
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Camera Option */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={startCamera}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Take Photo
                </Button>
              </div>
            </>
          )}

          {/* Camera View */}
          {isCameraActive && (
            <div className="space-y-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg"
              />
              <div className="flex gap-3">
                <Button
                  onClick={capturePhoto}
                  className="flex-1 bg-coral-400 hover:bg-coral-500"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Capture
                </Button>
                <Button
                  variant="outline"
                  onClick={stopCamera}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Selected Image Preview */}
          {selectedImage && (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={selectedImage}
                  alt="Selected"
                  className="w-full rounded-lg max-h-64 object-contain"
                />
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <Button
                onClick={() => analyzeImage(selectedImage)}
                disabled={isAnalyzing}
                className="w-full bg-coral-400 hover:bg-coral-500"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search Similar Products
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Instructions */}
          <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
            <p className="font-medium mb-2">Tips for best results:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Use clear, well-lit images</li>
              <li>Center the product in the frame</li>
              <li>Avoid busy backgrounds</li>
              <li>Supported: dresses, jewelry, beauty tools</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
