 import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  User,
  Package,
  MapPin,
  Settings,
  LogOut,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  Lock
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type TabType = 'profile' | 'orders' | 'addresses' | 'settings';

interface OrderItem {
  _id: string;
  name: string;
  image?: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  payment: { amount: number; method?: string };
  items: OrderItem[];
}

interface Address {
  _id?: string;
  type: 'home' | 'work' | 'other';
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

const defaultAddress: Address = {
  type: 'home',
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'India',
  isDefault: false
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated, logout, updateProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>((searchParams.get('tab') as TabType) || 'profile');
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const [addresses, setAddresses] = useState<Address[]>(user?.addresses || []);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addressForm, setAddressForm] = useState<Address>(defaultAddress);
  const [addressSaving, setAddressSaving] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  const [preferences, setPreferences] = useState({
    newsletter: true,
    notifications: { email: true, sms: false, push: true },
    language: 'en',
    currency: 'INR'
  });
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordAlert, setPasswordAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) navigate('/?login=required');
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name, phone: user.phone || '' });
      setAddresses(user.addresses || []);
    }
  }, [user]);

  useEffect(() => {
    setSearchParams({ tab: activeTab });
  }, [activeTab, setSearchParams]);

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'addresses') fetchAddresses();
  }, [activeTab]);

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const response = await api.get('/orders');
      if (response.data?.data) setOrders(response.data.data);
    } catch (error) {
      console.error('Failed to fetch orders', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await api.get('/auth/addresses');
      if (response.data?.data) setAddresses(response.data.data);
    } catch (error) {
      console.error('Failed to fetch addresses', error);
    }
  };

  const handleProfileSave = async () => {
    if (!profileForm.name.trim()) return;
    try {
      setProfileSaving(true);
      const response = await api.put('/auth/profile', profileForm);
      if (response.data.success) {
        updateProfile(response.data.data);
        setProfileSuccess('Profile updated successfully');
      }
    } catch (error) {
      console.error('Profile update failed', error);
    } finally {
      setProfileSaving(false);
      setTimeout(() => setProfileSuccess(null), 3000);
    }
  };

  const openAddressModal = (address?: Address) => {
    if (address) {
      setAddressForm(address);
      setEditingAddressId(address._id || null);
    } else {
      setAddressForm(defaultAddress);
      setEditingAddressId(null);
    }
    setAddressModalOpen(true);
  };

  const handleAddressSave = async () => {
    if (!addressForm.street.trim() || !addressForm.city.trim()) return;
    try {
      setAddressSaving(true);
      if (editingAddressId) {
        const response = await api.put(`/auth/addresses/${editingAddressId}`, addressForm);
        if (response.data.success) setAddresses(response.data.data);
      } else {
        const response = await api.post('/auth/addresses', addressForm);
        if (response.data.success) setAddresses(response.data.data);
      }
      setAddressModalOpen(false);
      setAddressForm(defaultAddress);
      setEditingAddressId(null);
    } catch (error) {
      console.error('Failed to save address', error);
    } finally {
      setAddressSaving(false);
    }
  };

  const handleAddressDelete = async (id?: string) => {
    if (!id) return;
    if (!window.confirm('Remove this address?')) return;
    try {
      const response = await api.delete(`/auth/addresses/${id}`);
      if (response.data.success) setAddresses(response.data.data);
    } catch (error) {
      console.error('Failed to delete address', error);
    }
  };

  const handlePasswordSave = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordAlert({ type: 'error', message: 'Enter all required fields' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordAlert({ type: 'error', message: 'New passwords do not match' });
      return;
    }
    try {
      setPasswordSaving(true);
      await api.put('/auth/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordAlert({ type: 'success', message: 'Password updated' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      setPasswordAlert({ type: 'error', message: error.message || 'Failed to update password' });
    } finally {
      setPasswordSaving(false);
      setTimeout(() => setPasswordAlert(null), 4000);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/?login=required');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-coral-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-slate-50 py-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="space-y-6">
            <UserCard user={user} ordersCount={orders.length} addressesCount={addresses.length} />
            <NavMenu activeTab={activeTab} onChange={setActiveTab} onLogout={handleLogout} />
          </aside>

          <section className="lg:col-span-3">
            <div className="bg-white rounded-3xl shadow-soft border border-slate-100 p-6 md:p-8 min-h-[520px]">
              {activeTab === 'profile' && (
                <ProfilePanel
                  form={profileForm}
                  setForm={setProfileForm}
                  saving={profileSaving}
                  success={profileSuccess}
                  onSave={handleProfileSave}
                  email={user.email}
                />
              )}

              {activeTab === 'orders' && (
                <OrdersPanel
                  orders={orders}
                  loading={ordersLoading}
                  expandedOrderId={expandedOrderId}
                  onToggle={(id) => setExpandedOrderId((prev) => (prev === id ? null : id))}
                />
              )}

              {activeTab === 'addresses' && (
                <AddressesPanel
                  addresses={addresses}
                  onAdd={() => openAddressModal()}
                  onEdit={openAddressModal}
                  onDelete={handleAddressDelete}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsPanel
                  preferences={preferences}
                  setPreferences={setPreferences}
                  onSavePreferences={() => {}}
                  prefsSaving={prefsSaving}
                  passwordForm={passwordForm}
                  setPasswordForm={setPasswordForm}
                  passwordSaving={passwordSaving}
                  passwordAlert={passwordAlert}
                  onChangePassword={handlePasswordSave}
                />
              )}
            </div>
          </section>
        </div>
      </div>

      {addressModalOpen && (
        <AddressModal
          form={addressForm}
          setForm={setAddressForm}
          isOpen={addressModalOpen}
          onClose={() => setAddressModalOpen(false)}
          onSave={handleAddressSave}
          saving={addressSaving}
          editing={!!editingAddressId}
        />
      )}
    </div>
  );
}

function UserCard({ user, ordersCount, addressesCount }: any) {
  return (
    <div className="bg-white rounded-3xl shadow-soft border border-slate-100 p-6 text-center space-y-4">
      <div className="w-20 h-20 mx-auto rounded-full bg-coral-100 text-coral-600 text-2xl font-semibold flex items-center justify-center">
        {user.name.charAt(0).toUpperCase()}
      </div>
      <div>
        <p className="text-xl font-display text-slate-900">{user.name}</p>
        <p className="text-sm text-slate-500">{user.email}</p>
        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs mt-3 rounded-full bg-slate-100 text-slate-600 uppercase tracking-wide">
          <CheckCircle2 className="w-3 h-3" /> {user.role}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="p-3 rounded-2xl bg-slate-50">
          <p className="text-slate-500">Orders</p>
          <p className="text-lg font-semibold">{ordersCount || '—'}</p>
        </div>
        <div className="p-3 rounded-2xl bg-slate-50">
          <p className="text-slate-500">Addresses</p>
          <p className="text-lg font-semibold">{addressesCount}</p>
        </div>
      </div>
    </div>
  );
}

function NavMenu({ activeTab, onChange, onLogout }: { activeTab: Tab; onChange: (tab: Tab) => void; onLogout: () => void }) {
  const items: { label: string; tab: Tab; icon: any }[] = [
    { label: 'Profile', tab: 'profile', icon: User },
    { label: 'Orders', tab: 'orders', icon: Package },
    { label: 'Saved Addresses', tab: 'addresses', icon: MapPin },
    { label: 'Settings', tab: 'settings', icon: Settings }
  ];

  return (
    <nav className="bg-white rounded-3xl shadow-soft border border-slate-100 p-3 space-y-2">
      {items.map(({ label, tab, icon: Icon }) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition ${
            activeTab === tab ? 'bg-coral-500 text-white shadow-lg shadow-coral-200' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span className="flex items-center gap-3 font-medium">
            <Icon className="w-4 h-4" /> {label}
          </span>
          <ChevronRight className="w-4 h-4" />
        </button>
      ))}
      <button
        onClick={onLogout}
        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-red-600 hover:bg-red-50 transition"
      >
        <span className="flex items-center gap-2 font-medium">
          <LogOut className="w-4 h-4" /> Log out
        </span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}

function ProfilePanel({ form, setForm, saving, notice, onSave, email }: any) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400">Profile</p>
          <h2 className="text-2xl font-display text-slate-900">Personal Information</h2>
        </div>
        <Button onClick={onSave} disabled={saving} className="bg-coral-500 hover:bg-coral-600 text-white">
          {saving ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600">Full name</label>
          <Input value={form.name} onChange={(e) => setForm((prev: any) => ({ ...prev, name: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600">Phone</label>
          <Input value={form.phone} onChange={(e) => setForm((prev: any) => ({ ...prev, phone: e.target.value }))} placeholder="+91" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-slate-600">Email</label>
          <Input value={email} disabled className="bg-slate-50" />
        </div>
      </div>
      {notice && (
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-4 py-2 rounded-xl">
          <CheckCircle2 className="w-4 h-4" /> {notice}
        </div>
      )}
    </div>
  );
}

function OrdersPanel({ orders, loading, expandedOrderId, onToggle }: any) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }
  if (!orders.length) {
    return (
      <div className="text-center py-16 space-y-4">
        <Package className="w-12 h-12 text-slate-300 mx-auto" />
...

      <div className="flex flex-wrap -mx-4">
        <div className="w-full xl:w-1/2 p-4">
          <div className="bg-white rounded-xl shadow-md p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Profile Information</h2>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
              <Input
                type="text"
                label="Name"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                required
              />
              <Input
                type="tel"
                label="Phone Number"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              />
              <Button onClick={handleProfileSave} disabled={profileSaving} className="bg-coral-400 hover:bg-coral-500 text-white">
                {profileSaving ? 'Saving...' : 'Save Profile'}
              </Button>
              {profileSuccess && (
                <div className="text-sm text-green-600">{profileSuccess}</div>
              )}
            </form>
          </div>
        </div>

        <div className="w-full xl:w-1/2 p-4">
          <div className="bg-white rounded-xl shadow-md p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Orders</h2>
            <div className="space-y-4">
              {ordersLoading ? (
                <div className="text-center py-4">
                  <Loader2 className="w-6 h-6 text-gray-600" />
                </div>
              ) : (
                orders.map((order) => (
                  <div key={order._id} className="bg-gray-50 p-4 rounded-xl shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Order #{order.orderNumber}</h3>
                    <p className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</p>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-sm text-gray-600">Total:</span>
                      <span className="text-lg font-bold text-gray-900">₹{order.payment.amount}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap -mx-4 mt-6">
        <div className="w-full xl:w-1/2 p-4">
          <div className="bg-white rounded-xl shadow-md p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Addresses</h2>
            <div className="space-y-4">
              {addresses.map((address) => (
                <div key={address._id} className="bg-gray-50 p-4 rounded-xl shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{address.type}</h3>
                  <p className="text-sm text-gray-600">{address.street}</p>
                  <p className="text-sm text-gray-600">{address.city}, {address.state} {address.zipCode}</p>
                  <div className="flex items-center justify-between mt-4">
                    <Button
                      onClick={() => openAddressModal(address)}
                      className="bg-coral-400 hover:bg-coral-500 text-white"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleAddressDelete(address._id)}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
              <Button onClick={() => openAddressModal()} className="bg-coral-400 hover:bg-coral-500 text-white">
                Add New Address
              </Button>
            </div>
          </div>
        </div>

        <div className="w-full xl:w-1/2 p-4">
          <div className="bg-white rounded-xl shadow-md p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Settings</h2>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Email Notifications:</span>
                <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out bg-coral-400 rounded-full cursor-pointer">
                  <span
                    className={`absolute left-6 top-1 w-4 h-4 bg-white rounded-full transition-all ${
                      preferences?.newsletter ? 'translate-x-6' : ''
                    }`}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Password:</span>
                <Button onClick={() => setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })}>
                  Change Password
                </Button>
              </div>
              {passwordForm.currentPassword && (
                <div>
                  <Input
                    type="password"
                    label="Current Password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  />
                  <Input
                    type="password"
                    label="New Password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  />
                  <Input
                    type="password"
                    label="Confirm New Password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  />
                  <Button onClick={handlePasswordSave} disabled={passwordSaving} className="bg-coral-400 hover:bg-coral-500 text-white">
                    {passwordSaving ? 'Saving...' : 'Save Password'}
                  </Button>
                  {passwordAlert && (
                    <div className={`text-sm ${passwordAlert.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                      {passwordAlert.message}
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {addressModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-md p-4 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-2">{editingAddressId ? 'Edit Address' : 'Add New Address'}</h2>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
              <Input
                type="text"
                label="Street Address"
                value={addressForm.street}
                onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                required
              />
              <Input
                type="text"
                label="City"
                value={addressForm.city}
                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                required
              />
              <Input
                type="text"
                label="State"
                value={addressForm.state}
                onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                required
              />
              <Input
                type="text"
                label="Zip Code"
                value={addressForm.zipCode}
                onChange={(e) => setAddressForm({ ...addressForm, zipCode: e.target.value })}
                required
              />
              <Button onClick={handleAddressSave} disabled={addressSaving} className="bg-coral-400 hover:bg-coral-500 text-white">
                {addressSaving ? 'Saving...' : 'Save Address'}
              </Button>
            </form>
            <Button onClick={() => setAddressModalOpen(false)} className="bg-red-500 hover:bg-red-600 text-white">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
