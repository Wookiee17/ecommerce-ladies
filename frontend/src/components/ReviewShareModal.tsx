import React, { useState } from 'react';
import { X, Share2, Link2, MessageCircle, Mail, Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface ReviewShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  productImage?: string;
}

const ReviewShareModal: React.FC<ReviewShareModalProps> = ({
  isOpen,
  onClose,
  productId,
  productName,
  productImage
}) => {
  const [copied, setCopied] = useState(false);
  const [reviewLink, setReviewLink] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  React.useEffect(() => {
    if (isOpen && productId) {
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/product/${productId}?review=true`;
      setReviewLink(link);
      setCustomMessage(`Hi! I'd love to hear your thoughts on ${productName}. Please leave a review here:`);
    }
  }, [isOpen, productId, productName]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(reviewLink);
    setCopied(true);
    toast.success('Review link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(`${customMessage}\n\n${reviewLink}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(`Please review ${productName}`);
    const body = encodeURIComponent(`${customMessage}\n\n${reviewLink}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleShareSMS = () => {
    const message = encodeURIComponent(`${customMessage} ${reviewLink}`);
    window.open(`sms:?body=${message}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Share2 className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Share Review Link</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Product Info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            {productImage && (
              <img
                src={productImage}
                alt={productName}
                className="w-12 h-12 object-cover rounded-lg"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{productName}</p>
              <p className="text-xs text-gray-500">Ask customers for reviews</p>
            </div>
          </div>

          {/* Custom Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Message (Optional)
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="Add a personal message..."
            />
          </div>

          {/* Review Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={reviewLink}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-600"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors flex items-center gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Share Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Share via
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={handleShareWhatsApp}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-green-50 hover:bg-green-100 transition-colors group"
              >
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-medium text-gray-700">WhatsApp</span>
              </button>

              <button
                onClick={handleShareEmail}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors group"
              >
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-medium text-gray-700">Email</span>
              </button>

              <button
                onClick={handleShareSMS}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors group"
              >
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Link2 className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-medium text-gray-700">SMS</span>
              </button>
            </div>
          </div>

          {/* Tips */}
          <div className="p-3 bg-amber-50 rounded-lg">
            <p className="text-xs text-amber-800">
              <strong>Tip:</strong> Share this link with customers after they receive their order to collect authentic reviews!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewShareModal;
