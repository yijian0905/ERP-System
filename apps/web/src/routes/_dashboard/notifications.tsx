import { createFileRoute } from '@tanstack/react-router';
import {
  AlertCircle,
  Bell,
  Check,
  CheckCheck,
  Info,
  Package,
  ShoppingCart,
  Trash2,
  Users,
} from 'lucide-react';
import { useState } from 'react';

import { DashboardCard, PageContainer, PageHeader } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_dashboard/notifications')({
  component: NotificationsPage,
});

// Notification types
type NotificationType = 'info' | 'success' | 'warning' | 'error';
type NotificationCategory = 'order' | 'inventory' | 'customer' | 'system';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  read: boolean;
  createdAt: string;
}

// Mock notifications data
const initialNotifications: Notification[] = [
  {
    id: '1',
    title: 'New Order Received',
    message: 'Order #SO-2312-00045 has been placed by Acme Corporation for $1,250.00',
    type: 'success',
    category: 'order',
    read: false,
    createdAt: '2024-12-07T10:30:00Z',
  },
  {
    id: '2',
    title: 'Low Stock Alert',
    message: 'Wireless Mouse (ELEC-001) is running low. Current stock: 5 units. Reorder point: 20 units.',
    type: 'warning',
    category: 'inventory',
    read: false,
    createdAt: '2024-12-07T09:15:00Z',
  },
  {
    id: '3',
    title: 'Payment Received',
    message: 'Payment of $890.00 received from TechStart Inc. for Invoice #INV-2312-00044',
    type: 'success',
    category: 'order',
    read: false,
    createdAt: '2024-12-07T08:45:00Z',
  },
  {
    id: '4',
    title: 'New Customer Registered',
    message: 'Smart Solutions has been added as a new customer.',
    type: 'info',
    category: 'customer',
    read: true,
    createdAt: '2024-12-06T16:20:00Z',
  },
  {
    id: '5',
    title: 'Invoice Overdue',
    message: 'Invoice #INV-2312-00043 for Global Systems is now overdue. Amount: $2,340.00',
    type: 'error',
    category: 'order',
    read: true,
    createdAt: '2024-12-06T14:00:00Z',
  },
  {
    id: '6',
    title: 'System Maintenance',
    message: 'Scheduled maintenance will occur on Sunday, Dec 8 from 2:00 AM to 4:00 AM UTC.',
    type: 'info',
    category: 'system',
    read: true,
    createdAt: '2024-12-05T10:00:00Z',
  },
  {
    id: '7',
    title: 'Product Stock Updated',
    message: 'Stock for Mechanical Keyboard (ELEC-002) has been updated. New quantity: 75 units.',
    type: 'info',
    category: 'inventory',
    read: true,
    createdAt: '2024-12-05T09:30:00Z',
  },
];

const typeStyles: Record<NotificationType, { bg: string; icon: string; border: string }> = {
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950',
    icon: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
  },
  success: {
    bg: 'bg-green-50 dark:bg-green-950',
    icon: 'text-green-600 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950',
    icon: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-950',
    icon: 'text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
  },
};

const categoryIcons: Record<NotificationCategory, React.ComponentType<{ className?: string }>> = {
  order: ShoppingCart,
  inventory: Package,
  customer: Users,
  system: Info,
};

function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredNotifications = filter === 'unread' 
    ? notifications.filter((n) => !n.read) 
    : notifications;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllRead = () => {
    setNotifications((prev) => prev.filter((n) => !n.read));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Notifications"
        description={`You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
        actions={
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" onClick={markAllAsRead}>
                <CheckCheck className="mr-2 h-4 w-4" />
                Mark All Read
              </Button>
            )}
            {notifications.some((n) => n.read) && (
              <Button variant="outline" onClick={clearAllRead}>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Read
              </Button>
            )}
          </div>
        }
      />

      {/* Filter tabs */}
      <div className="mb-6 flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({notifications.length})
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('unread')}
        >
          <Bell className="mr-2 h-4 w-4" />
          Unread ({unreadCount})
        </Button>
      </div>

      {/* Notifications list */}
      <DashboardCard>
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No notifications</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {filter === 'unread' 
                ? "You're all caught up! No unread notifications." 
                : 'You have no notifications yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => {
              const styles = typeStyles[notification.type];
              const CategoryIcon = categoryIcons[notification.category];
              const TypeIcon = notification.type === 'error' 
                ? AlertCircle 
                : notification.type === 'success' 
                  ? Check 
                  : Info;

              return (
                <div
                  key={notification.id}
                  className={cn(
                    'relative flex gap-4 rounded-lg border p-4 transition-colors',
                    styles.bg,
                    styles.border,
                    !notification.read && 'ring-2 ring-primary/20'
                  )}
                >
                  {/* Unread indicator */}
                  {!notification.read && (
                    <div className="absolute left-2 top-2 h-2 w-2 rounded-full bg-primary" />
                  )}

                  {/* Icon */}
                  <div className={cn('flex-shrink-0 mt-0.5', styles.icon)}>
                    <CategoryIcon className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className={cn(
                          'font-medium',
                          !notification.read && 'font-semibold'
                        )}>
                          {notification.title}
                        </h4>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>

                      {/* Type indicator */}
                      <div className={cn('flex-shrink-0', styles.icon)}>
                        <TypeIcon className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => markAsRead(notification.id)}
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => deleteNotification(notification.id)}
                      title="Delete"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DashboardCard>

      {/* Info card */}
      <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100">
          📬 Notification Settings
        </h3>
        <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
          Configure your notification preferences in Settings → General to control which 
          notifications you receive and how you receive them.
        </p>
      </div>
    </PageContainer>
  );
}
