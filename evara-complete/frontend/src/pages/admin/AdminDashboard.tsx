import { useState, useEffect } from 'react';
import { 
  Users, ShoppingBag, TrendingUp, DollarSign, 
  Package, Eye, Clock, MapPin, Activity,
  ChevronRight, Search, Filter, Download
} from 'lucide-react';
import { useBackend } from '@/context/BackendContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

const COLORS = ['#ff6c79', '#ffd85d', '#c084fc', '#4ade80', '#60a5fa'];

export default function AdminDashboard() {
  const { request } = useBackend();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const data = await request('/admin/dashboard');
      setDashboardData(data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-coral-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = dashboardData?.stats || {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">Welcome back, Admin</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <div className="w-10 h-10 rounded-full bg-coral-100 flex items-center justify-center">
              <span className="text-coral-600 font-semibold">A</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r min-h-screen">
          <nav className="p-4 space-y-1">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'products', label: 'Products', icon: Package },
              { id: 'sellers', label: 'Sellers', icon: ShoppingBag },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
              { id: 'settings', label: 'Settings', icon: MapPin },
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
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="Total Users"
                  value={stats.totalUsers || 0}
                  change="+12%"
                  icon={Users}
                  color="bg-blue-500"
                />
                <StatCard
                  title="Total Sellers"
                  value={stats.totalSellers || 0}
                  change="+8%"
                  icon={ShoppingBag}
                  color="bg-green-500"
                />
                <StatCard
                  title="Total Products"
                  value={stats.totalProducts || 0}
                  change="+15%"
                  icon={Package}
                  color="bg-purple-500"
                />
                <StatCard
                  title="Today's Revenue"
                  value={`₹${stats.sales?.today || 0}`}
                  change="+23%"
                  icon={DollarSign}
                  color="bg-coral-500"
                />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Growth Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>User Growth (Last 30 Days)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={dashboardData?.userGrowth || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="count" 
                          stroke="#ff6c79" 
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Device Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>Device Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Mobile', value: dashboardData?.deviceBreakdown?.mobile || 0 },
                            { name: 'Desktop', value: dashboardData?.deviceBreakdown?.desktop || 0 },
                            { name: 'Tablet', value: dashboardData?.deviceBreakdown?.tablet || 0 },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {COLORS.map((color, index) => (
                            <Cell key={`cell-${index}`} fill={color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity & Top Products */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Recent Activity</CardTitle>
                    <Button variant="ghost" size="sm">View All</Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(dashboardData?.recentActivity || []).slice(0, 5).map((activity: any, index: number) => (
                        <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                          <div className="w-10 h-10 rounded-full bg-coral-100 flex items-center justify-center">
                            <Activity className="w-5 h-5 text-coral-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{activity.activityType}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(activity.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <Badge variant="outline">{activity.page}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Products */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Top Products</CardTitle>
                    <Button variant="ghost" size="sm">View All</Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(dashboardData?.topProducts || []).slice(0, 5).map((product: any) => (
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
                            <p className="text-xs text-gray-500">{product.stats?.sales || 0} sales</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Pending Verifications */}
              {(dashboardData?.pendingVerifications || []).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-orange-500" />
                      Pending Seller Verifications
                      <Badge className="bg-orange-100 text-orange-600">
                        {dashboardData.pendingVerifications.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {dashboardData.pendingVerifications.slice(0, 3).map((seller: any) => (
                        <div key={seller._id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-600 font-medium">
                                {seller.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{seller.name}</p>
                              <p className="text-sm text-gray-500">{seller.email}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="text-green-600">
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600">
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'users' && <UsersManagement />}
          {activeTab === 'products' && <ProductsManagement />}
          {activeTab === 'sellers' && <SellersManagement />}
          {activeTab === 'analytics' && <AnalyticsDetailed />}
        </main>
      </div>
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

function UsersManagement() {
  const { request } = useBackend();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await request('/admin/users');
      setUsers(data.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Users Management</h2>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search users..." 
              className="pl-10 w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Role</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Joined</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: any) => (
                <tr key={user._id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-coral-100 flex items-center justify-center">
                        <span className="text-coral-600 font-medium">{user.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={
                      user.role === 'admin' ? 'bg-purple-100 text-purple-600' :
                      user.role === 'seller' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={user.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function ProductsManagement() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Products Management</h2>
        <Button>Add New Product</Button>
      </div>
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">Products management interface coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}

function SellersManagement() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Sellers Management</h2>
        <Button>Export List</Button>
      </div>
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">Sellers management interface coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}

function AnalyticsDetailed() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Detailed Analytics</h2>
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">Detailed analytics interface coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
