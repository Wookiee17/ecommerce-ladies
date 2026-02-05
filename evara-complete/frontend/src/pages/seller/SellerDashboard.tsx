import { useState, useEffect, useRef } from 'react';
import { 
  Package, Plus, Upload, Download, TrendingUp, DollarSign,
  ShoppingCart, Star, Edit, Trash2, Eye, X, Check,
  Image as ImageIcon, FileSpreadsheet, FileJson, ChevronDown,
  Palette, Ruler, Tag, Layers, Box, Search, Filter,
  BarChart3, Settings, User, LogOut, Menu
} from 'lucide-react';
import { useBackend } from '@/context/BackendContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription 
} from '@/components/ui/dialog';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

const CATEGORIES = {
  dresses: {
    name: 'Dresses',
    subcategories: ['Casual', 'Formal', 'Party', 'Ethnic', 'Summer', 'Winter'],
    attributes: ['size', 'color', 'material']
  },
  jewelry: {
    name: 'Jewelry',
    subcategories: ['Necklaces', 'Earrings', 'Rings', 'Bracelets', 'Anklets', 'Sets'],
    attributes: ['material', 'gemstone']
  },
  'beauty-electronics': {
    name: 'Beauty Electronics',
    subcategories: ['Nail Care', 'Skincare', 'Hair Care', 'Makeup Tools', 'Massage'],
    attributes: ['power', 'warranty']
  }
};

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];
const COLORS = [
  { name: 'Red', hex: '#ef4444' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Gold', hex: '#ffd700' },
  { name: 'Silver', hex: '#c0c0c0' },
  { name: 'Rose Gold', hex: '#b76e79' }
];

export default function SellerDashboard() {
  const { request } = useBackend();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const data = await request('/seller/dashboard');
      setDashboardData(data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-coral-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-20">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Seller Dashboard</h1>
              <p className="text-xs text-gray-500">Manage your products and sales</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 rounded-full bg-coral-100 flex items-center justify-center">
              <span className="text-coral-600 font-semibold">S</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-white border-r min-h-screen transition-all duration-300 overflow-hidden`}>
          <nav className="p-4 space-y-1">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'products', label: 'My Products', icon: Package },
              { id: 'add-product', label: 'Add Product', icon: Plus },
              { id: 'bulk-upload', label: 'Bulk Upload', icon: Upload },
              { id: 'orders', label: 'Orders', icon: ShoppingCart },
              { id: 'earnings', label: 'Earnings', icon: DollarSign },
              { id: 'profile', label: 'Profile', icon: User },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === item.id 
                    ? 'bg-coral-50 text-coral-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
            <Separator className="my-4" />
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors">
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeTab === 'overview' && <OverviewTab data={dashboardData} />}
          {activeTab === 'products' && <ProductsTab />}
          {activeTab === 'add-product' && <AddProductTab onSuccess={() => setActiveTab('products')} />}
          {activeTab === 'bulk-upload' && <BulkUploadTab />}
          {activeTab === 'orders' && <OrdersTab />}
          {activeTab === 'earnings' && <EarningsTab />}
          {activeTab === 'profile' && <ProfileTab />}
        </main>
      </div>
    </div>
  );
}

function OverviewTab({ data }: { data: any }) {
  const stats = data?.stats || {};
  
  const salesData = [
    { month: 'Jan', sales: 12000 },
    { month: 'Feb', sales: 15000 },
    { month: 'Mar', sales: 18000 },
    { month: 'Apr', sales: 14000 },
    { month: 'May', sales: 22000 },
    { month: 'Jun', sales: 28000 },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Products"
          value={stats.totalProducts || 0}
          change="+5"
          icon={Package}
          color="bg-blue-500"
        />
        <StatCard
          title="Total Sales"
          value={stats.totalSales || 0}
          change="+12%"
          icon={ShoppingCart}
          color="bg-green-500"
        />
        <StatCard
          title="Total Earnings"
          value={`₹${stats.totalEarnings || 0}`}
          change="+8%"
          icon={DollarSign}
          color="bg-coral-500"
        />
        <StatCard
          title="Rating"
          value={stats.averageRating || '4.5'}
          change="+0.2"
          icon={Star}
          color="bg-yellow-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="sales" stroke="#ff6c79" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(data?.topProducts || []).slice(0, 5).map((product: any) => (
                <div key={product._id} className="flex items-center gap-4">
                  <img 
                    src={product.images?.[0]?.url || '/placeholder.jpg'} 
                    alt={product.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{product.price}</p>
                    <p className="text-xs text-gray-500">{product.stats?.sales || 0} sold</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(data?.recentOrders || []).slice(0, 5).map((order: any) => (
              <div key={order._id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-coral-100 flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-coral-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Order #{order.orderNumber}</p>
                    <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">₹{order.total}</p>
                  <Badge className={
                    order.status === 'delivered' ? 'bg-green-100 text-green-600' :
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-blue-100 text-blue-600'
                  }>
                    {order.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProductsTab() {
  const { request } = useBackend();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editProduct, setEditProduct] = useState<any>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await request('/seller/products');
      setProducts(data.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await request(`/seller/products/${id}`, { method: 'DELETE' });
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const filteredProducts = products.filter((p: any) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl font-bold">My Products</h2>
        <div className="flex gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search products..." 
              className="pl-10 w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="dresses">Dresses</SelectItem>
              <SelectItem value="jewelry">Jewelry</SelectItem>
              <SelectItem value="beauty-electronics">Beauty Electronics</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product: any) => (
          <Card key={product._id} className="overflow-hidden group">
            <div className="relative aspect-square">
              <img 
                src={product.images?.[0]?.url || '/placeholder.jpg'} 
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  size="icon" 
                  variant="secondary"
                  onClick={() => setEditProduct(product)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  size="icon" 
                  variant="destructive"
                  onClick={() => handleDelete(product._id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <Badge className="absolute top-2 left-2">
                {product.category}
              </Badge>
            </div>
            <CardContent className="p-4">
              <h3 className="font-medium truncate">{product.name}</h3>
              <div className="flex items-center justify-between mt-2">
                <p className="font-bold text-coral-600">₹{product.price}</p>
                <p className="text-sm text-gray-500">Stock: {product.stock}</p>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm">{product.rating || 4.5}</span>
                <span className="text-xs text-gray-500">({product.reviews?.length || 0})</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Product Dialog */}
      <Dialog open={!!editProduct} onOpenChange={() => setEditProduct(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {editProduct && <ProductForm product={editProduct} onSuccess={() => { setEditProduct(null); fetchProducts(); }} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AddProductTab({ onSuccess }: { onSuccess: () => void }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Add New Product</h2>
      <Card>
        <CardContent className="p-6">
          <ProductForm onSuccess={onSuccess} />
        </CardContent>
      </Card>
    </div>
  );
}

function ProductForm({ product, onSuccess }: { product?: any, onSuccess: () => void }) {
  const { request } = useBackend();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>(product?.images?.map((i: any) => i.url) || []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || '',
    originalPrice: product?.originalPrice || '',
    category: product?.category || '',
    subcategory: product?.subcategory || '',
    stock: product?.stock || '',
    material: product?.attributes?.material || '',
    colors: product?.attributes?.colors || [],
    sizes: product?.attributes?.sizes || [],
    tags: product?.tags?.join(', ') || '',
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload images first
      const uploadedImages = [];
      for (const image of images) {
        const imageFormData = new FormData();
        imageFormData.append('image', image);
        
        const uploadRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/seller/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('evara_token')}`
          },
          body: imageFormData
        });
        
        const uploadData = await uploadRes.json();
        if (uploadData.success) {
          uploadedImages.push({ url: uploadData.data.url, alt: formData.name });
        }
      }

      // Create product
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
        category: formData.category,
        subcategory: formData.subcategory,
        stock: parseInt(formData.stock),
        images: uploadedImages.length > 0 ? uploadedImages : product?.images || [],
        attributes: {
          material: formData.material,
          colors: formData.colors,
          sizes: formData.sizes,
        },
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      };

      const endpoint = product ? `/seller/products/${product._id}` : '/seller/products';
      const method = product ? 'PUT' : 'POST';

      await request(endpoint, {
        method,
        body: JSON.stringify(productData),
      });

      toast.success(product ? 'Product updated successfully' : 'Product created successfully');
      onSuccess();
    } catch (error) {
      toast.error('Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = CATEGORIES[formData.category as keyof typeof CATEGORIES];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Images */}
      <div>
        <Label>Product Images</Label>
        <div className="mt-2 grid grid-cols-4 gap-4">
          {imagePreviews.map((preview, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
              <img src={preview} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 hover:border-coral-400 transition-colors"
          >
            <ImageIcon className="w-8 h-8 text-gray-400" />
            <span className="text-sm text-gray-500">Add Image</span>
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter product name"
            required
          />
        </div>
        
        <div className="md:col-span-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter product description"
            rows={4}
            required
          />
        </div>

        <div>
          <Label htmlFor="price">Price (₹) *</Label>
          <Input
            id="price"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="Enter price"
            required
          />
        </div>

        <div>
          <Label htmlFor="originalPrice">Original Price (₹)</Label>
          <Input
            id="originalPrice"
            type="number"
            value={formData.originalPrice}
            onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
            placeholder="Enter original price (for discount display)"
          />
        </div>

        <div>
          <Label htmlFor="category">Category *</Label>
          <Select 
            value={formData.category} 
            onValueChange={(value) => setFormData({ ...formData, category: value, subcategory: '' })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORIES).map(([key, cat]) => (
                <SelectItem key={key} value={key}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="subcategory">Subcategory</Label>
          <Select 
            value={formData.subcategory} 
            onValueChange={(value) => setFormData({ ...formData, subcategory: value })}
            disabled={!selectedCategory}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select subcategory" />
            </SelectTrigger>
            <SelectContent>
              {selectedCategory?.subcategories.map((sub) => (
                <SelectItem key={sub} value={sub.toLowerCase()}>{sub}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="stock">Stock Quantity *</Label>
          <Input
            id="stock"
            type="number"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            placeholder="Enter stock quantity"
            required
          />
        </div>

        <div>
          <Label htmlFor="material">Material</Label>
          <Input
            id="material"
            value={formData.material}
            onChange={(e) => setFormData({ ...formData, material: e.target.value })}
            placeholder="e.g., Cotton, Silk, Gold"
          />
        </div>
      </div>

      {/* Colors */}
      {formData.category === 'dresses' && (
        <div>
          <Label className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Available Colors
          </Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {COLORS.map((color) => (
              <button
                key={color.name}
                type="button"
                onClick={() => {
                  const newColors = formData.colors.includes(color.name)
                    ? formData.colors.filter((c: string) => c !== color.name)
                    : [...formData.colors, color.name];
                  setFormData({ ...formData, colors: newColors });
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                  formData.colors.includes(color.name)
                    ? 'border-coral-400 bg-coral-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span 
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="text-sm">{color.name}</span>
                {formData.colors.includes(color.name) && <Check className="w-4 h-4 text-coral-600" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sizes */}
      {formData.category === 'dresses' && (
        <div>
          <Label className="flex items-center gap-2">
            <Ruler className="w-4 h-4" />
            Available Sizes
          </Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => {
                  const newSizes = formData.sizes.includes(size)
                    ? formData.sizes.filter((s: string) => s !== size)
                    : [...formData.sizes, size];
                  setFormData({ ...formData, sizes: newSizes });
                }}
                className={`px-4 py-2 rounded-lg border transition-all ${
                  formData.sizes.includes(size)
                    ? 'border-coral-400 bg-coral-50 text-coral-600'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      <div>
        <Label className="flex items-center gap-2">
          <Tag className="w-4 h-4" />
          Tags (comma separated)
        </Label>
        <Input
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          placeholder="e.g., trending, new arrival, bestseller"
          className="mt-2"
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="bg-coral-500 hover:bg-coral-600">
          {loading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </form>
  );
}

function BulkUploadTab() {
  const { request } = useBackend();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);

  const downloadTemplate = (format: 'xlsx' | 'csv' | 'json') => {
    const template = {
      name: 'Sample Product',
      description: 'Product description here',
      price: 999,
      originalPrice: 1299,
      category: 'dresses',
      subcategory: 'casual',
      stock: 100,
      material: 'Cotton',
      colors: 'Red,Blue,Black',
      sizes: 'S,M,L,XL',
      tags: 'trending,new',
      imageUrls: 'https://example.com/image1.jpg,https://example.com/image2.jpg'
    };

    if (format === 'json') {
      const dataStr = JSON.stringify([template, template], null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'product-template.json';
      a.click();
    } else if (format === 'csv') {
      const headers = Object.keys(template).join(',');
      const values = Object.values(template).join(',');
      const csv = `${headers}\n${values}`;
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'product-template.csv';
      a.click();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Parse preview
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          if (selectedFile.name.endsWith('.json')) {
            const data = JSON.parse(event.target?.result as string);
            setPreview(Array.isArray(data) ? data.slice(0, 5) : [data]);
          }
        } catch (error) {
          toast.error('Invalid file format');
        }
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      await request('/seller/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      toast.success('Products uploaded successfully');
      setFile(null);
      setPreview([]);
    } catch (error) {
      toast.error('Failed to upload products');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Bulk Upload Products</h2>

      {/* Template Downloads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Download Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 mb-4">
            Download a sample template to see the required format for bulk uploads.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Button variant="outline" onClick={() => downloadTemplate('xlsx')}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Excel (.xlsx)
            </Button>
            <Button variant="outline" onClick={() => downloadTemplate('csv')}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              CSV (.csv)
            </Button>
            <Button variant="outline" onClick={() => downloadTemplate('json')}>
              <FileJson className="w-4 h-4 mr-2" />
              JSON (.json)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload File
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".xlsx,.csv,.json"
              onChange={handleFileSelect}
              className="hidden"
              id="bulk-upload"
            />
            <label htmlFor="bulk-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium">Click to upload or drag and drop</p>
              <p className="text-gray-500">Excel, CSV, or JSON files</p>
            </label>
            {file && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
            )}
          </div>

          {preview.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium mb-3">Preview (First 5 items)</h4>
              <div className="space-y-2">
                {preview.map((item, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg text-sm">
                    <p><strong>{item.name}</strong> - ₹{item.price}</p>
                    <p className="text-gray-500">{item.category} | Stock: {item.stock}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {file && (
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={handleUpload} 
                disabled={uploading}
                className="bg-coral-500 hover:bg-coral-600"
              >
                {uploading ? 'Uploading...' : 'Upload Products'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• <strong>name</strong> - Product name (required)</li>
            <li>• <strong>description</strong> - Product description</li>
            <li>• <strong>price</strong> - Selling price in INR (required)</li>
            <li>• <strong>originalPrice</strong> - Original price for discount display</li>
            <li>• <strong>category</strong> - dresses, jewelry, or beauty-electronics (required)</li>
            <li>• <strong>subcategory</strong> - Specific subcategory</li>
            <li>• <strong>stock</strong> - Available quantity (required)</li>
            <li>• <strong>colors</strong> - Comma-separated color names</li>
            <li>• <strong>sizes</strong> - Comma-separated sizes (for dresses)</li>
            <li>• <strong>imageUrls</strong> - Comma-separated image URLs</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function OrdersTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Orders</h2>
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">Orders management coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}

function EarningsTab() {
  const earningsData = [
    { month: 'Jan', earnings: 8500 },
    { month: 'Feb', earnings: 10200 },
    { month: 'Mar', earnings: 12500 },
    { month: 'Apr', earnings: 9800 },
    { month: 'May', earnings: 15600 },
    { month: 'Jun', earnings: 18900 },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Earnings</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-500">Total Earnings</p>
            <p className="text-3xl font-bold text-coral-600">₹75,500</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-500">This Month</p>
            <p className="text-3xl font-bold text-green-600">₹18,900</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-500">Pending Payout</p>
            <p className="text-3xl font-bold text-yellow-600">₹5,200</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Earnings History</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={earningsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="earnings" fill="#ff6c79" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Seller Profile</h2>
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-coral-100 flex items-center justify-center">
              <span className="text-2xl text-coral-600 font-bold">S</span>
            </div>
            <div>
              <h3 className="font-bold text-lg">Your Store</h3>
              <p className="text-gray-500">seller@example.com</p>
              <Badge className="mt-1 bg-green-100 text-green-600">Verified Seller</Badge>
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Business Name</Label>
              <Input defaultValue="Your Store" />
            </div>
            <div>
              <Label>GST Number</Label>
              <Input placeholder="Enter GST number" />
            </div>
            <div>
              <Label>PAN Number</Label>
              <Input placeholder="Enter PAN number" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input placeholder="Enter phone number" />
            </div>
          </div>

          <div className="flex justify-end">
            <Button className="bg-coral-500 hover:bg-coral-600">Save Changes</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, change, icon: Icon, color }: any) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <p className="text-sm text-green-600 mt-1">{change} from last month</p>
          </div>
          <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
