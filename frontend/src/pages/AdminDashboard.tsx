import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import {
    Users,
    ShoppingBag,
    DollarSign,
    TrendingUp,
    Package,
    Settings,
    Search,
    XCircle,
    AlertCircle
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';

// Types
interface DashboardStats {
    totalUsers: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    recentOrders: any[];
}

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
}

interface Product {
    _id: string;
    name: string;
    price: number;
    category: string;
    stock: number;
    isActive: boolean;
    image: string;
}

export default function AdminDashboard() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'products' | 'settings'>('overview');
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    // Data States
    const [users, setUsers] = useState<User[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    // Mock Chart Data (Visuals)
    const revenueData = [
        { name: 'Mon', value: 4000 },
        { name: 'Tue', value: 3000 },
        { name: 'Wed', value: 2000 },
        { name: 'Thu', value: 2780 },
        { name: 'Fri', value: 1890 },
        { name: 'Sat', value: 2390 },
        { name: 'Sun', value: 3490 },
    ];

    const userGrowthData = [
        { name: 'Jan', value: 100 },
        { name: 'Feb', value: 120 },
        { name: 'Mar', value: 150 },
        { name: 'Apr', value: 180 },
        { name: 'May', value: 220 },
        { name: 'Jun', value: 300 },
    ];

    useEffect(() => {
        fetchDashboardData();
    }, [activeTab]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'overview') {
                // In a real app, you'd fetch /api/admin/dashboard
                // const { data } = await api.get('/admin/dashboard');
                // setStats(data);

                // Simulating API delay and response
                setTimeout(() => {
                    setStats({
                        totalUsers: 142,
                        totalProducts: products.length || 150, // Fallback to seeded count
                        totalOrders: 45,
                        totalRevenue: 125000,
                        recentOrders: []
                    });
                }, 800);
            } else if (activeTab === 'users') {
                const { data } = await api.get('/admin/users');
                setUsers(data.data || []);
            } else if (activeTab === 'products') {
                const { data } = await api.get('/products'); // Public endpoint is fine for list
                setProducts(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!user || (user as any).role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-500">You do not have permission to view this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pt-20 pb-12">
            <div className="container mx-auto px-4 max-w-7xl">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-display font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="text-gray-500 mt-2">Welcome back, {user.name}. Here's what's happening today.</p>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-4 mb-8 border-b border-gray-200 pb-1">
                    {[
                        { id: 'overview', label: 'Overview', icon: TrendingUp },
                        { id: 'users', label: 'Users', icon: Users },
                        { id: 'products', label: 'Products', icon: ShoppingBag },
                        { id: 'settings', label: 'Settings', icon: Settings },
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

                {/* Content */}
                {loading && !stats && !users.length && !products.length ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-coral-500"></div>
                    </div>
                ) : (
                    <div className="space-y-6 animate-fade-in">

                        {/* OVERVIEW TAB */}
                        {activeTab === 'overview' && (
                            <>
                                {/* Stats Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {[
                                        { label: 'Total Revenue', value: '$125,000', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
                                        { label: 'Active Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
                                        { label: 'Total Products', value: stats?.totalProducts || 0, icon: Package, color: 'text-purple-600', bg: 'bg-purple-100' },
                                        { label: 'Total Orders', value: stats?.totalOrders || 0, icon: ShoppingBag, color: 'text-orange-600', bg: 'bg-orange-100' },
                                    ].map((stat, index) => (
                                        <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className={`p-3 rounded-xl ${stat.bg}`}>
                                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                                </div>
                                                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">+12%</span>
                                            </div>
                                            <h3 className="text-gray-500 text-sm font-medium">{stat.label}</h3>
                                            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Charts */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                        <h3 className="text-lg font-bold text-gray-900 mb-6">Revenue Overview</h3>
                                        <div className="h-[300px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={revenueData}>
                                                    <defs>
                                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.1} />
                                                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} tickFormatter={(value) => `$${value}`} />
                                                    <Tooltip
                                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                    />
                                                    <Area type="monotone" dataKey="value" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                        <h3 className="text-lg font-bold text-gray-900 mb-6">User Growth</h3>
                                        <div className="h-[300px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={userGrowthData}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                                                    <Tooltip
                                                        cursor={{ fill: '#f3f4f6' }}
                                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                    />
                                                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* USERS TAB */}
                        {activeTab === 'users' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-gray-900">All Users</h3>
                                    <div className="relative">
                                        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            placeholder="Search users..."
                                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500 transition-all w-64"
                                        />
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50/50 text-gray-500 font-medium text-sm">
                                            <tr>
                                                <th className="px-6 py-4">Name</th>
                                                <th className="px-6 py-4">Email</th>
                                                <th className="px-6 py-4">Role</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {users.map((user) => (
                                                <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                                                    <td className="px-6 py-4 text-gray-500">{user.email}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin'
                                                            ? 'bg-purple-100 text-purple-800'
                                                            : 'bg-blue-100 text-blue-800'
                                                            }`}>
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                            Active
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button className="text-gray-400 hover:text-coral-500 transition-colors">Edit</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* PRODUCTS TAB */}
                        {activeTab === 'products' && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-gray-900">Product Management</h3>
                                    <div className="relative">
                                        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            placeholder="Search products..."
                                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500 transition-all w-64"
                                        />
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50/50 text-gray-500 font-medium text-sm">
                                            <tr>
                                                <th className="px-6 py-4">Product</th>
                                                <th className="px-6 py-4">Category</th>
                                                <th className="px-6 py-4">Price</th>
                                                <th className="px-6 py-4">Stock</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {products.slice(0, 10).map((product) => (
                                                <tr key={product._id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <img
                                                                src={product.image}
                                                                alt={product.name}
                                                                className="w-10 h-10 rounded-lg object-cover bg-gray-100"
                                                            />
                                                            <span className="font-medium text-gray-900 truncate max-w-[200px]">{product.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-500 capitalize">{product.category}</td>
                                                    <td className="px-6 py-4 text-gray-900 font-medium">${product.price}</td>
                                                    <td className="px-6 py-4 text-gray-500">{product.stock}</td>
                                                    <td className="px-6 py-4">
                                                        {product.isActive ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                Active
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                Inactive
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                                        <button className="p-1 text-gray-400 hover:text-blue-500 transition-colors">
                                                            <Settings className="w-4 h-4" />
                                                        </button>
                                                        <button className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                    </div>
                )}
            </div>
        </div>
    );
}
