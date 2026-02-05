import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import {
    ShoppingBag,
    DollarSign,
    PlusCircle,
    Package,
    UploadCloud,
    Check
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

// Types
interface Product {
    _id: string;
    name: string;
    price: number;
    category: string;
    stock: number;
    image: string;
    isActive: boolean;
}

export default function SellerDashboard() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'overview' | 'add-product' | 'my-products'>('overview');

    const [myProducts, setMyProducts] = useState<Product[]>([]);

    // Form State
    const [newProduct, setNewProduct] = useState({
        name: '',
        description: '',
        price: '',
        category: 'dress',
        stock: '',
        image: ''
    });
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const salesData = [
        { name: 'Mon', sales: 12 },
        { name: 'Tue', sales: 19 },
        { name: 'Wed', sales: 3 },
        { name: 'Thu', sales: 5 },
        { name: 'Fri', sales: 2 },
        { name: 'Sat', sales: 3 },
    ];

    useEffect(() => {
        if (activeTab === 'my-products') {
            fetchMyProducts();
        }
    }, [activeTab]);

    const fetchMyProducts = async () => {
        try {
            // In real app: const { data } = await api.get('/seller/products');
            // Mocking for now as we might not have seller-token set up completely in this session
            const { data } = await api.get('/products');
            setMyProducts(data.data.slice(0, 5) || []);
        } catch (error) {
            console.error('Failed to fetch products', error);
        }
    };

    const handleCreateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitStatus('idle');
        try {
            // Mock API call
            // await api.post('/seller/products', newProduct);
            await new Promise(resolve => setTimeout(resolve, 1000));
            setSubmitStatus('success');
            setNewProduct({ name: '', description: '', price: '', category: 'dress', stock: '', image: '' });
        } catch (error) {
            setSubmitStatus('error');
        }
    };

    if (!user) {
        return <div className="min-h-screen pt-20 text-center">Please log in to view this page.</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pt-20 pb-12">
            <div className="container mx-auto px-4 max-w-7xl">

                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-gray-900">Seller Dashboard</h1>
                        <p className="text-gray-500 mt-2">Manage your inventory and track your sales.</p>
                    </div>
                    <button
                        onClick={() => setActiveTab('add-product')}
                        className="flex items-center gap-2 bg-coral-500 hover:bg-coral-600 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-coral-500/20 active:scale-95"
                    >
                        <PlusCircle className="w-5 h-5" />
                        Add New Product
                    </button>
                </div>

                {/* Navigation Tabs */}
                <div className="flex flex-wrap gap-4 mb-8 border-b border-gray-200 pb-1">
                    {[
                        { id: 'overview', label: 'Overview', icon: DollarSign },
                        { id: 'my-products', label: 'My Products', icon: Package },
                        { id: 'add-product', label: 'Add Product', icon: UploadCloud },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all relative ${activeTab === tab.id
                                ? 'text-coral-500 bg-coral-50/50 rounded-t-lg border-b-2 border-coral-500'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 rounded-t-lg'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="animate-fade-in">

                    {/* OVERVIEW */}
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Stats */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-green-100 rounded-xl text-green-600">
                                        <DollarSign className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Total Earnings</p>
                                        <p className="text-2xl font-bold text-gray-900">$12,450</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
                                        <ShoppingBag className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Orders This Month</p>
                                        <p className="text-2xl font-bold text-gray-900">45</p>
                                    </div>
                                </div>
                            </div>

                            {/* Chart */}
                            <div className="md:col-span-2 lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900 mb-6">Sales Performance</h3>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={salesData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                                            <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                            <Bar dataKey="sales" fill="#ec4899" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ADD PRODUCT FORM */}
                    {activeTab === 'add-product' && (
                        <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">List a New Product</h2>

                            {submitStatus === 'success' && (
                                <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl flex items-center gap-2">
                                    <Check className="w-5 h-5" /> Product listed successfully!
                                </div>
                            )}

                            <form onSubmit={handleCreateProduct} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                                    <input
                                        required
                                        type="text"
                                        value={newProduct.name}
                                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-coral-500 focus:ring-4 focus:ring-coral-500/10 outline-none transition-all"
                                        placeholder="e.g. Vintage Silk Dress"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
                                        <input
                                            required
                                            type="number"
                                            value={newProduct.price}
                                            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-coral-500 focus:ring-4 focus:ring-coral-500/10 outline-none transition-all"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Stock Qty</label>
                                        <input
                                            required
                                            type="number"
                                            value={newProduct.stock}
                                            onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-coral-500 focus:ring-4 focus:ring-coral-500/10 outline-none transition-all"
                                            placeholder="100"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                                    <select
                                        value={newProduct.category}
                                        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-coral-500 focus:ring-4 focus:ring-coral-500/10 outline-none transition-all"
                                    >
                                        <option value="dress">Dress</option>
                                        <option value="jewelry">Jewelry</option>
                                        <option value="beauty">Beauty</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                                    <input
                                        type="url"
                                        value={newProduct.image}
                                        onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-coral-500 focus:ring-4 focus:ring-coral-500/10 outline-none transition-all"
                                        placeholder="https://..."
                                    />
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-gray-900/10"
                                    >
                                        List Product
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* MY PRODUCTS TAB */}
                    {activeTab === 'my-products' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900">Your Inventory</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50/50 text-gray-500 font-medium text-sm">
                                        <tr>
                                            <th className="px-6 py-4">Product</th>
                                            <th className="px-6 py-4">Price</th>
                                            <th className="px-6 py-4">Stock</th>
                                            <th className="px-6 py-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {myProducts.map((product) => (
                                            <tr key={product._id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={product.image}
                                                            alt={product.name}
                                                            className="w-10 h-10 rounded-lg object-cover bg-gray-100"
                                                        />
                                                        <span className="font-medium text-gray-900">{product.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-900 font-medium">${product.price}</td>
                                                <td className="px-6 py-4 text-gray-500">{product.stock}</td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        Active
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {myProducts.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                                    No products found. Start listing!
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
