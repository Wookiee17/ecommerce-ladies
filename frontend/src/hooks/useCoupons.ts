import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface Coupon {
  _id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount: number;
  validUntil: string;
  obtainedAt: string;
  isUsed: boolean;
}

export function useCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserCoupons = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('evara_token');
      if (!token) {
        setCoupons([]);
        return;
      }

      try {
        const response: any = await api.get('/coupons/user');
        if (response.success) {
          setCoupons(response.data);
        } else {
          setError(response.message || 'Failed to fetch coupons');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch coupons');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Fetch coupons error:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateCoupon = async (code: string, cartTotal: number) => {
    try {
      const token = localStorage.getItem('evara_token');
      if (!token) {
        return { valid: false, message: 'Please login to use coupons' };
      }

      const response: any = await api.post('/coupons/validate', { code, cartTotal });
      return response;
    } catch (err) {
      console.error('Validate coupon error:', err);
      return { valid: false, message: 'Network error. Please try again.' };
    }
  };

  const applyCoupon = async (code: string, orderId?: string) => {
    try {
      const token = localStorage.getItem('evara_token');
      if (!token) {
        return { success: false, message: 'Please login to use coupons' };
      }

      const data: any = await api.post('/coupons/apply', { code, orderId });

      if (data.success) {
        // Refresh coupons after applying
        await fetchUserCoupons();
      }

      return data;
    } catch (err) {
      console.error('Apply coupon error:', err);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const calculateDiscount = (coupon: Coupon, cartTotal: number) => {
    if (cartTotal < coupon.minOrderAmount) {
      return 0;
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (cartTotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
        discount = coupon.maxDiscountAmount;
      }
    } else {
      discount = coupon.discountValue;
    }

    return discount;
  };

  const getBestCoupon = (cartTotal: number) => {
    const validCoupons = coupons.filter(coupon =>
      !coupon.isUsed &&
      new Date(coupon.validUntil) > new Date() &&
      cartTotal >= coupon.minOrderAmount
    );

    if (validCoupons.length === 0) return null;

    return validCoupons.reduce((best, current) => {
      const bestDiscount = calculateDiscount(best, cartTotal);
      const currentDiscount = calculateDiscount(current, cartTotal);
      return currentDiscount > bestDiscount ? current : best;
    });
  };

  useEffect(() => {
    fetchUserCoupons();
  }, []);

  return {
    coupons,
    loading,
    error,
    fetchUserCoupons,
    validateCoupon,
    applyCoupon,
    calculateDiscount,
    getBestCoupon
  };
}
