import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { api } from '@/lib/api';

interface CommunityTryOn {
    id: string;
    imageUrl: string;
    userName: string;
    userAvatar?: string;
    savedAt: string;
}

interface CommunityTryOnsProps {
    productId: string;
}

export default function CommunityTryOns({ productId }: CommunityTryOnsProps) {
    const [tryOns, setTryOns] = useState<CommunityTryOn[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        fetchCommunityTryOns();
    }, [productId]);

    const fetchCommunityTryOns = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/gallery/product/${productId}?limit=8`);
            if (response.success) {
                setTryOns(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch community try-ons:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return null; // Don't show loading state, just hide section
    }

    if (tryOns.length === 0) {
        return null; // Don't show section if no try-ons
    }

    return (
        <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Users className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-bold">Community Try-Ons</h2>
                    <span className="text-muted-foreground">({tryOns.length} looks)</span>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {tryOns.map((tryOn) => (
                    <div
                        key={tryOn.id}
                        className="group relative aspect-square bg-muted rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all"
                        onClick={() => setSelectedImage(selectedImage === tryOn.imageUrl ? null : tryOn.imageUrl)}
                    >
                        <img
                            src={tryOn.imageUrl}
                            alt={`Try-on by ${tryOn.userName}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        {/* User badge */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-medium">
                                    {tryOn.userName.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-white text-sm font-medium truncate">
                                    {tryOn.userName}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Expanded image view */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <img
                        src={selectedImage}
                        alt="Try-on"
                        className="max-w-full max-h-full object-contain rounded-lg"
                    />
                </div>
            )}
        </section>
    );
}
