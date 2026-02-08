import { useState, useEffect } from 'react';
import { X, Gift, Clock, Tag, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

interface PromotionalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignupSuccess: () => void;
}

export default function PromotionalModal({ isOpen, onClose, onSignupSuccess }: PromotionalModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSignupForm, setShowSignupForm] = useState(false);
  const { login } = useAuth();

  useEffect(() => {
    // Track modal view when opened
    if (isOpen) {
      trackModalView();
    }
  }, [isOpen]);

  const trackModalView = async () => {
    try {
      const token = localStorage.getItem('evara_token');
      if (token) {
        await api.post('/coupons/track-modal', {});
      }
    } catch (error) {
      console.error('Failed to track modal view:', error);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data: any = await api.post('/auth/register', {
        name,
        email,
        password
      });

      if (data.success) {
        localStorage.setItem('evara_token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        await login(data.data.token, data.data.user);
        onSignupSuccess();
        onClose();
      } else {
        alert(data.message || 'Signup failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert('Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNoThanks = () => {
    // Store in localStorage to prevent showing again for 30 days
    localStorage.setItem('promoModalDismissed', new Date().toISOString());
    onClose();
  };

  const shouldShowModal = () => {
    const dismissed = localStorage.getItem('promoModalDismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return dismissedDate < thirtyDaysAgo;
    }
    return true;
  };

  if (!isOpen || !shouldShowModal()) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full relative overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white text-center">
          <div className="flex justify-center mb-4">
            <Gift className="w-16 h-16" />
          </div>
          <h2 className="text-2xl font-bold mb-2">🎉 Special Offer!</h2>
          <p className="text-lg">Sign up today and get 30% OFF</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {!showSignupForm ? (
            <div className="text-center space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Tag className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-purple-800">30% Discount</span>
                </div>
                <p className="text-sm text-gray-600">Valid for 7 days on all categories</p>
              </div>

              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Limited time offer</span>
              </div>

              <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 text-left">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-white shadow-sm">
                    <Instagram className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-pink-700">Follow us on Instagram</p>
                    <a
                      href="https://www.instagram.com/evara_ind/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-pink-600 hover:text-pink-800"
                    >
                      @evara_ind
                    </a>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <Button
                  onClick={() => setShowSignupForm(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3"
                >
                  Get My 30% OFF →
                </Button>

                <Button
                  variant="outline"
                  onClick={handleNoThanks}
                  className="w-full border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  No thanks, I'll pay full price
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Create a password"
                  minLength={6}
                />
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                <p className="text-green-800">
                  🎁 Your 30% OFF coupon will be sent to your email after signup!
                </p>
              </div>

              <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 text-left">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-white shadow-sm">
                    <Instagram className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-pink-700">Follow us on Instagram</p>
                    <a
                      href="https://www.instagram.com/evara_ind/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-pink-600 hover:text-pink-800"
                    >
                      @evara_ind
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
                >
                  {isLoading ? 'Creating Account...' : 'Sign Up & Get 30% OFF'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSignupForm(false)}
                  className="px-4"
                >
                  Back
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 text-center text-xs text-gray-500">
          <p>By signing up, you agree to receive promotional emails.</p>
          <p>You can unsubscribe at any time. Valid for new customers only.</p>
        </div>
      </div>
    </div>
  );
}
