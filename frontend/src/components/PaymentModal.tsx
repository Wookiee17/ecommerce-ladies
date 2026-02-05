import { useState, useEffect } from 'react';
import { CreditCard, Smartphone, Banknote, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderDetails: {
    orderId: string;
    orderNumber: string;
    amount: number;
    items: any[];
  } | null;
  onPaymentSuccess: () => void;
}

export default function PaymentModal({ isOpen, onClose, orderDetails, onPaymentSuccess }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load Razorpay script
    if (!document.getElementById('razorpay-script')) {
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      document.body.appendChild(script);
    }
  }, []);

  const handlePayment = async () => {
    if (!orderDetails) return;

    setLoading(true);

    try {
      if (paymentMethod === 'cod') {
        // COD - just confirm
        toast.success('Order placed! Pay ₹' + orderDetails.amount + ' on delivery.');
        onPaymentSuccess();
        onClose();
        return;
      }

      // For online payments
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('evara_token')}`
        },
        body: JSON.stringify({
          orderId: orderDetails.orderId,
          paymentMethod
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      // Initialize Razorpay
      const options = {
        key: data.data.keyId,
        amount: data.data.amount * 100,
        currency: 'INR',
        name: 'Evara',
        description: `Order #${orderDetails.orderNumber}`,
        order_id: data.data.razorpayOrderId,
        handler: async (response: any) => {
          // Verify payment
          const verifyRes = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('evara_token')}`
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
          });

          const verifyData = await verifyRes.json();

          if (verifyData.success) {
            toast.success('Payment successful!');
            onPaymentSuccess();
            onClose();
          } else {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: data.data.prefill?.name,
          email: data.data.prefill?.email,
          contact: data.data.prefill?.contact
        },
        theme: {
          color: '#ff6c79'
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          }
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();

    } catch (error: any) {
      toast.error(error.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    {
      id: 'razorpay',
      name: 'Pay Online',
      description: 'Cards, UPI, Net Banking, Wallets',
      icon: CreditCard,
      color: 'bg-blue-500'
    },
    {
      id: 'upi',
      name: 'UPI',
      description: 'Google Pay, PhonePe, Paytm, BHIM',
      icon: Smartphone,
      color: 'bg-purple-500'
    },
    {
      id: 'cod',
      name: 'Cash on Delivery',
      description: 'Pay when you receive (+₹50)',
      icon: Banknote,
      color: 'bg-green-500'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
        {orderDetails && (
          <p className="text-sm text-gray-500">
            Order #{orderDetails.orderNumber} • ₹{orderDetails.amount}
          </p>
        )}
        </DialogHeader>

        <div className="space-y-6">
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div key={method.id}>
                  <RadioGroupItem
                    value={method.id}
                    id={method.id}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={method.id}
                    className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all peer-data-[state=checked]:border-coral-400 peer-data-[state=checked]:bg-coral-50 hover:bg-gray-50"
                  >
                    <div className={`w-10 h-10 rounded-lg ${method.color} flex items-center justify-center`}>
                      <method.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{method.name}</p>
                      <p className="text-sm text-gray-500">{method.description}</p>
                    </div>
                    {paymentMethod === method.id && (
                      <Check className="w-5 h-5 text-coral-400" />
                    )}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between text-sm mb-2">
              <span>Subtotal</span>
              <span>₹{orderDetails?.amount || 0}</span>
            </div>
            {paymentMethod === 'cod' && (
              <div className="flex justify-between text-sm mb-2">
                <span>COD Fee</span>
                <span>₹50</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span>₹{(orderDetails?.amount || 0) + (paymentMethod === 'cod' ? 50 : 0)}</span>
            </div>
          </div>

          <Button
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-coral-400 hover:bg-coral-500"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay ₹${(orderDetails?.amount || 0) + (paymentMethod === 'cod' ? 50 : 0)}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
