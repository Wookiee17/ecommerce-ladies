import React, { createContext, useContext, useState, type ReactNode } from 'react';
import axios from 'axios';

interface TryOnContextType {
    userImage: File | null;
    uploadUserImage: (file: File) => void;
    generatedImages: Map<string, string>; // productId -> imageUrl
    generateTryOn: (productId: string, productImage: string) => Promise<void>;
    loading: boolean;
    error: string | null;
}

const TryOnContext = createContext<TryOnContextType | undefined>(undefined);

export const TryOnProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [userImage, setUserImage] = useState<File | null>(null);
    const [generatedImages, setGeneratedImages] = useState<Map<string, string>>(new Map());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const uploadUserImage = (file: File) => {
        setUserImage(file);
        // Clear previous generations when a new user image is set
        setGeneratedImages(new Map());
    };

    const generateTryOn = async (productId: string, productImageUrl: string) => {
        if (!userImage) {
            setError("Please upload a user image first.");
            return;
        }

        // Check cache
        if (generatedImages.has(productId)) return;

        setLoading(true);
        setError(null);

        try {
            // 1. Fetch product image as blob (proxy through frontend if needed to avoid CORS, or trust backend handles URL)
            // Actually, our backend endpoint expects a FILE upload for product image too.
            // So we need to fetch the product image URL and convert to Blob.

            const productResponse = await fetch(productImageUrl);
            const productBlob = await productResponse.blob();

            const formData = new FormData();
            formData.append('userImage', userImage);
            formData.append('productImage', productBlob, 'product.jpg');
            formData.append('prompt', "Generate a realistic virtual try-on image.");

            const response = await axios.post('http://localhost:5000/api/try-on/virtual-try-on', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // Handle response
            // If we got a text description (fallback), we might want to show that or a placeholder.
            // If we got an image (base64 or URL), use it.

            let resultImage = '';
            if (typeof response.data === 'string') {
                // It's binary image data directly? Axios might handle this differently.
                // If responseType was arraybuffer, we'd convert. 
                // But our backend now returns JSON with `description` or `image`.
            }

            if (response.data.success) {
                if (response.data.image) {
                    resultImage = response.data.image; // If we implement returning base64/url
                } else if (response.data.description) {
                    // Fallback: We can't show a text description as an image.
                    // For demonstration, we might overlay a "Text Result" badge or similar.
                    console.warn("Try-On returned text description:", response.data.description);
                    // Store a placeholder or the text to be displayed in a tooltip?
                    // Let's store a special marker.
                    // resultImage = `text:${response.data.description}`;

                    // FORCE SUCCESS FOR UI:
                    // Since we want to see "something" happen, let's use the USER image as a placeholder 
                    // but maybe with a filter? No that's misleading.
                    // Let's just alert the user for now if it's text.

                    alert(`Try-On Analysis: ${response.data.description}`);
                    return;
                }
            } else {
                // Did we get a binary response? 
                // Previous implementation sent binary. 
                // Updated implementation sends JSON.
                // Let's assume we might get a Blob if I fixed it to return image.
            }

            // If we actually get an image URL (e.g. from Cloudinary in a future iteration), use it.
            // For now, if we don't get a valid image string, we won't set state.
            if (resultImage) {
                setGeneratedImages(prev => new Map(prev).set(productId, resultImage));
            }

        } catch (err: any) {
            console.error("Try-On Error:", err);
            setError(err.response?.data?.message || "Failed to generate try-on.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <TryOnContext.Provider value={{ userImage, uploadUserImage, generatedImages, generateTryOn, loading, error }}>
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
