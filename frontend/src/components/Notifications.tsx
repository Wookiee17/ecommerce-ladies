import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Bell, Trash2, Package, Tag, Info } from 'lucide-react';
import { useState } from 'react';

// Mock notifications for now - in real app would come from context/API
const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    type: 'order',
    title: 'Order Confirmed',
    message: 'Your order #1234 has been successfully placed.',
    time: '2 mins ago',
    read: false
  },
  {
    id: '2',
    type: 'promo',
    title: 'Summer Sale',
    message: 'Get 20% off on all summer collections!',
    time: '1 hour ago',
    read: false
  },
  {
    id: '3',
    type: 'system',
    title: 'Account Update',
    message: 'Your profile information has been updated.',
    time: '1 day ago',
    read: true
  }
];

interface NotificationsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Notifications({ isOpen, onClose }: NotificationsProps) {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return <Package className="w-4 h-4 text-blue-500" />;
      case 'promo': return <Tag className="w-4 h-4 text-coral-500" />;
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md flex flex-col bg-white">
        <SheetHeader className="border-b border-gray-100 pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-display text-2xl font-bold flex items-center gap-2">
              Notifications
            </SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs text-coral-500 hover:text-coral-600 hover:bg-coral-50"
              >
                Mark all as read
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-6 -mx-6 px-6">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                <Bell className="h-10 w-10 text-gray-300" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-gray-900 mb-1">No notifications</h3>
                <p className="text-gray-500">You're all caught up!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`relative p-4 rounded-xl border transition-all duration-200 ${notification.read
                    ? 'bg-white border-gray-100'
                    : 'bg-coral-50/30 border-coral-100'
                    } group hover:shadow-sm`}
                >
                  <div className="flex gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${notification.read ? 'bg-gray-100' : 'bg-white shadow-sm'
                      }`}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className={`font-medium text-sm ${notification.read ? 'text-gray-900' : 'text-gray-900'
                          }`}>
                          {notification.title}
                        </h4>
                        <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                          {notification.time}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="absolute top-2 right-2 p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
