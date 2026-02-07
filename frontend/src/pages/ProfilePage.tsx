import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { User, Package, MapPin, Settings, LogOut, Plus, Trash2, Edit2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCategory } from '@/context/CategoryContext';

type TabType = 'profile' | 'orders' | 'addresses' | 'settings';

export default function ProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, updateProfile } = useAuth();
  const { getBackgroundClass } = useCategory();

  const activeTab = (searchParams.get('tab') as TabType) || 'profile';

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleTabChange = (tab: TabType) => {
    setSearchParams({ tab });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className={`min-h-screen pt-24 pb-12 transition-colors duration-500 ${getBackgroundClass()}`}>
      <div className="section-padding">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

            {/* Sidebar Navigation */}
            <div className="md:col-span-1 space-y-6">
              {/* User Card */}
              <div className="bg-white/50 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-sm text-center">
                <div className="w-24 h-24 rounded-full bg-coral-100 mx-auto mb-4 flex items-center justify-center text-coral-600 text-3xl font-medium border-4 border-white shadow-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <h2 className="font-display text-xl font-bold text-gray-900">{user.name}</h2>
                <p className="text-gray-500 text-sm mt-1">{user.email}</p>
                <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-coral-100 text-coral-800 capitalize">
                  {user.role} Account
                </div>
              </div>

              {/* Navigation Menu */}
              <div className="bg-white/50 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-sm overflow-hidden">
                <nav className="space-y-1">
                  <button
                    onClick={() => handleTabChange('profile')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${activeTab === 'profile'
                      ? 'bg-coral-400 text-white shadow-md shadow-coral-400/20'
                      : 'text-gray-600 hover:bg-white/60'
                      }`}
                  >
                    <User className="w-5 h-5" />
                    <span className="font-medium">My Profile</span>
                  </button>

                  <button
                    onClick={() => handleTabChange('orders')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${activeTab === 'orders'
                      ? 'bg-coral-400 text-white shadow-md shadow-coral-400/20'
                      : 'text-gray-600 hover:bg-white/60'
                      }`}
                  >
                    <Package className="w-5 h-5" />
                    <span className="font-medium">My Orders</span>
                  </button>

                  <button
                    onClick={() => handleTabChange('addresses')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${activeTab === 'addresses'
                      ? 'bg-coral-400 text-white shadow-md shadow-coral-400/20'
                      : 'text-gray-600 hover:bg-white/60'
                      }`}
                  >
                    <MapPin className="w-5 h-5" />
                    <span className="font-medium">Saved Addresses</span>
                  </button>

                  <button
                    onClick={() => handleTabChange('settings')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${activeTab === 'settings'
                      ? 'bg-coral-400 text-white shadow-md shadow-coral-400/20'
                      : 'text-gray-600 hover:bg-white/60'
                      }`}
                  >
                    <Settings className="w-5 h-5" />
                    <span className="font-medium">Settings</span>
                  </button>

                  <div className="pt-4 mt-4 border-t border-gray-200/50">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="font-medium">Log Out</span>
                    </button>
                  </div>
                </nav>
              </div>
            </div>

            {/* Content Area */}
            <div className="md:col-span-3">
              <div className="bg-white/50 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/20 shadow-sm min-h-[500px]">
                {activeTab === 'profile' && <ProfileTab user={user} updateProfile={updateProfile} />}
                {activeTab === 'orders' && <OrdersTab />}
                {activeTab === 'addresses' && <AddressesTab user={user} updateProfile={updateProfile} />}
                {activeTab === 'settings' && <SettingsTab />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components (Placeholders for now, will implement logic next)

function ProfileTab({ user, updateProfile }: { user: any, updateProfile: any }) {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      updateProfile({ ...user, ...formData });
      setIsEditing(false);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display text-2xl font-bold text-gray-900">Personal Information</h3>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2">
            <Edit2 className="w-4 h-4" /> Edit Profile
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Full Name</label>
            <Input
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              disabled={!isEditing}
              className="bg-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Phone Number</label>
            <Input
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              disabled={!isEditing}
              className="bg-white"
              placeholder="+91"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-700">Email Address</label>
            <Input
              value={formData.email}
              disabled={true}
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500">Email address cannot be changed</p>
          </div>
        </div>

        {isEditing && (
          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={loading} className="bg-coral-400 hover:bg-coral-500 text-white min-w-[120px]">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button type="button" onClick={() => setIsEditing(false)} variant="ghost">
              Cancel
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get('/orders');
        if (response.data.success) {
          setOrders(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) {
    return <div className="text-center py-12">Loading orders...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="font-display text-xl font-bold text-gray-900 mb-2">No Orders Yet</h3>
        <p className="text-gray-500">Go explore our collection and make your first purchase!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-display text-2xl font-bold text-gray-900 mb-6">My Orders</h3>
      {orders.map(order => (
        <div key={order._id} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="font-medium text-gray-900">Order #{order.orderNumber}</p>
              <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
              order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                'bg-blue-100 text-blue-700'
              } capitalize`}>
              {order.status}
            </span>
          </div>
          <div className="space-y-2">
            {order.items.slice(0, 2).map((item: any) => (
              <div key={item._id} className="flex gap-4 items-center">
                <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden">
                  {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-medium">₹{item.price}</p>
              </div>
            ))}
            {order.items.length > 2 && (
              <p className="text-xs text-gray-500 mt-2">+ {order.items.length - 2} more items</p>
            )}
          </div>
          <div className="border-t mt-4 pt-4 flex justify-between items-center">
            <span className="text-sm text-gray-500">Total Amount</span>
            <span className="font-bold text-lg">₹{order.payment.amount}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function AddressesTab({ user, updateProfile }: { user: any, updateProfile: (data: any) => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newAddress, setNewAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    type: 'home'
  });

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedAddresses = [...(user.addresses || []), { ...newAddress, isDefault: false }];
    try {
      const response = await api.put('/auth/profile', { addresses: updatedAddresses });
      if (response.data.success) {
        updateProfile(response.data.data);
        setIsAdding(false);
        setNewAddress({ street: '', city: '', state: '', zipCode: '', type: 'home' });
      }
    } catch (error) {
      console.error('Failed to add address:', error);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    const updatedAddresses = user.addresses.filter((addr: any) => addr._id !== addressId);
    try {
      const response = await api.put('/auth/profile', { addresses: updatedAddresses });
      if (response.data.success) {
        updateProfile(response.data.data);
      }
    } catch (error) {
      console.error('Failed to delete address:', error);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display text-2xl font-bold text-gray-900">Saved Addresses</h3>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} className="bg-coral-400 hover:bg-coral-500 text-white gap-2">
            <Plus className="w-4 h-4" /> Add New Address
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-6">
          <h4 className="font-medium text-gray-900 mb-4">New Address Details</h4>
          <form onSubmit={handleAddAddress} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder="Street Address" value={newAddress.street} onChange={e => setNewAddress({ ...newAddress, street: e.target.value })} required className="bg-white md:col-span-2" />
            <Input placeholder="City" value={newAddress.city} onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} required className="bg-white" />
            <Input placeholder="State" value={newAddress.state} onChange={e => setNewAddress({ ...newAddress, state: e.target.value })} required className="bg-white" />
            <Input placeholder="Zip Code" value={newAddress.zipCode} onChange={e => setNewAddress({ ...newAddress, zipCode: e.target.value })} required className="bg-white" />
            <div className="md:col-span-2 flex gap-4 mt-2">
              <Button type="submit" className="bg-coral-400 hover:bg-coral-500 text-white">Save Address</Button>
              <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {(!user.addresses || user.addresses.length === 0) && !isAdding ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <MapPin className="w-8 h-8 text-coral-400" />
          </div>
          <h4 className="font-medium text-gray-900 mb-1">No addresses saved</h4>
          <p className="text-sm text-gray-500 mb-4">Add an address for faster checkout</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {user.addresses?.map((addr: any) => (
            <div key={addr._id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative group">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteAddress(addr._id)}
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-coral-400" />
                <span className="font-medium capitalize">{addr.type}</span>
              </div>
              <p className="text-gray-600 text-sm">{addr.street}</p>
              <p className="text-gray-600 text-sm">{addr.city}, {addr.state} {addr.zipCode}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsTab() {
  return (
    <div>
      <h3 className="font-display text-2xl font-bold text-gray-900 mb-6">Account Settings</h3>
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
          <div>
            <h4 className="font-medium text-gray-900">Email Notifications</h4>
            <p className="text-sm text-gray-500">Receive updates about your orders and promotions</p>
          </div>
          <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out bg-coral-400 rounded-full cursor-pointer">
            <span className="absolute left-6 top-1 w-4 h-4 bg-white rounded-full transition-all"></span>
          </div>
        </div>

        <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-4">Change Password</h4>
          <div className="space-y-4 max-w-md">
            <Input type="password" placeholder="Current Password" className="bg-white" />
            <Input type="password" placeholder="New Password" className="bg-white" />
            <Input type="password" placeholder="Confirm New Password" className="bg-white" />
            <Button variant="outline">Update Password</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
