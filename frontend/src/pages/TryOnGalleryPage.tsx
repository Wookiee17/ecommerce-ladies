import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Eye, EyeOff, ExternalLink, Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import ImageLightbox from '@/components/ImageLightbox';

interface GalleryItem {
    id: string;
    imageUrl: string;
    savedAt: string;
    isPublic: boolean;
    product: {
        id: string;
        name: string;
        image: string;
        price: number;
        category: string;
    } | null;
}

export default function TryOnGalleryPage() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    useEffect(() => {
        if (isAuthenticated) {
            fetchGallery();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated]);

    const fetchGallery = async () => {
        try {
            setLoading(true);
            const response = await api.get('/gallery/my');
            if (response.data?.success) {
                setGalleryItems(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch gallery:', error);
            toast.error('Failed to load gallery');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/gallery/${id}`);
            setGalleryItems(prev => prev.filter(item => item.id !== id));
            toast.success('Removed from gallery');
        } catch (error) {
            console.error('Failed to delete:', error);
            toast.error('Failed to remove');
        }
    };

    const handleTogglePublic = async (id: string) => {
        try {
            const response = await api.patch(`/gallery/${id}/toggle-public`);
            if (response.data?.success) {
                setGalleryItems(prev => prev.map(item =>
                    item.id === id ? { ...item, isPublic: response.data.data.isPublic } : item
                ));
                toast.success(response.data.message);
            }
        } catch (error) {
            console.error('Failed to toggle:', error);
            toast.error('Failed to update');
        }
    };

    const openLightbox = (index: number) => {
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(price);
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Camera className="h-16 w-16 mx-auto text-muted-foreground" />
                    <h2 className="text-2xl font-bold">Sign in to view your Try-On Gallery</h2>
                    <Button onClick={() => navigate('/login')}>Sign In</Button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">My Try-On Gallery</h1>
                    <p className="text-muted-foreground">
                        Your saved virtual try-on images. {galleryItems.length > 0 && `${galleryItems.length} items`}
                    </p>
                </div>

                {galleryItems.length === 0 ? (
                    <div className="text-center py-16 space-y-4">
                        <Camera className="h-20 w-20 mx-auto text-muted-foreground/50" />
                        <h3 className="text-xl font-semibold text-muted-foreground">No try-on images yet</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Use Virtual Try-On on any product and save your favorite looks here!
                        </p>
                        <Button onClick={() => navigate('/')}>Browse Products</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {galleryItems.map((item, index) => (
                            <div
                                key={item.id}
                                className="group bg-card rounded-xl overflow-hidden border shadow-sm hover:shadow-lg transition-all"
                            >
                                {/* Image */}
                                <div
                                    className="aspect-square bg-muted relative cursor-pointer"
                                    onClick={() => openLightbox(index)}
                                >
                                    <img
                                        src={item.imageUrl}
                                        alt="Try-on"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                    {/* Public/Private badge */}
                                    <Badge
                                        className={`absolute top-3 right-3 ${item.isPublic
                                                ? 'bg-green-500/90 hover:bg-green-600'
                                                : 'bg-gray-500/90 hover:bg-gray-600'
                                            }`}
                                    >
                                        {item.isPublic ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                                        {item.isPublic ? 'Public' : 'Private'}
                                    </Badge>
                                </div>

                                {/* Product info */}
                                {item.product && (
                                    <div className="p-4">
                                        <h3 className="font-medium text-sm line-clamp-1 mb-1">{item.product.name}</h3>
                                        <p className="text-primary font-semibold text-sm">{formatPrice(item.product.price)}</p>
                                        <p className="text-xs text-muted-foreground mt-1">Saved {formatDate(item.savedAt)}</p>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="px-4 pb-4 flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => item.product && navigate(`/product/${item.product.id}`)}
                                    >
                                        <ExternalLink className="h-4 w-4 mr-1" />
                                        View Product
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleTogglePublic(item.id)}
                                        title={item.isPublic ? 'Make private' : 'Make public'}
                                    >
                                        {item.isPublic ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(item.id)}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox */}
            <ImageLightbox
                images={galleryItems.map(item => item.imageUrl)}
                initialIndex={lightboxIndex}
                isOpen={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
            />
        </div>
    );
}
