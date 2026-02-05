import { useState } from 'react';
import { Tag, Clock, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface CouponCardProps {
  code: string;
  description: string;
  discountValue: number;
  discountType: 'percentage' | 'fixed';
  validUntil: string;
  minOrderAmount?: number;
  isUsed?: boolean;
  onApply?: (code: string) => void;
}

export default function CouponCard({
  code,
  description,
  discountValue,
  discountType,
  validUntil,
  minOrderAmount = 0,
  isUsed = false,
  onApply
}: CouponCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const handleApply = () => {
    if (onApply && !isUsed) {
      onApply(code);
    }
  };

  const getDaysRemaining = () => {
    const now = new Date();
    const expiry = new Date(validUntil);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const daysRemaining = getDaysRemaining();
  const isExpired = daysRemaining === 0;

  return (
    <Card className={`border-2 ${isUsed ? 'border-gray-200 opacity-60' : isExpired ? 'border-red-200' : 'border-green-200'} transition-all duration-200 hover:shadow-md`}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Tag className={`w-5 h-5 ${isUsed ? 'text-gray-400' : isExpired ? 'text-red-500' : 'text-green-600'}`} />
            <span className={`font-semibold text-lg ${isUsed ? 'text-gray-500' : isExpired ? 'text-red-600' : 'text-green-700'}`}>
              {discountType === 'percentage' ? `${discountValue}% OFF` : `₹${discountValue} OFF`}
            </span>
          </div>
          
          {isUsed && (
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
              Used
            </span>
          )}
          
          {isExpired && !isUsed && (
            <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
              Expired
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-3">{description}</p>

        {/* Coupon Code */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-lg tracking-wider">{code}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyCode}
              disabled={isUsed || isExpired}
              className="h-8 w-8 p-0"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Validity */}
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-3">
          <Clock className="w-4 h-4" />
          <span>
            {isUsed ? 'Already used' : isExpired ? 'Expired' : `${daysRemaining} days left`}
          </span>
        </div>

        {/* Minimum order info */}
        {minOrderAmount > 0 && !isUsed && !isExpired && (
          <p className="text-xs text-gray-500 mb-3">
            Minimum order: ₹{minOrderAmount}
          </p>
        )}

        {/* Apply Button */}
        {!isUsed && !isExpired && onApply && (
          <Button
            onClick={handleApply}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            Apply Coupon
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
