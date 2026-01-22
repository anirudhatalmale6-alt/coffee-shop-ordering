'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { CheckCircle2, Clock, Coffee, MapPin, Phone, User, RefreshCw } from 'lucide-react';
import { formatPrice, formatDateTime } from '@/lib/utils';

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  cupNames: string[];
  menuItem: {
    name: string;
    image: string | null;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerMobile: string;
  pickupTime: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  pickupLocation: {
    name: string;
    address: string | null;
  };
  items: OrderItem[];
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: 'Pending', color: 'text-yellow-600 bg-yellow-50', icon: <Clock size={20} /> },
  CONFIRMED: { label: 'Confirmed', color: 'text-blue-600 bg-blue-50', icon: <CheckCircle2 size={20} /> },
  PREPARING: { label: 'Preparing', color: 'text-orange-600 bg-orange-50', icon: <Coffee size={20} /> },
  READY: { label: 'Ready for Pickup', color: 'text-green-600 bg-green-50', icon: <CheckCircle2 size={20} /> },
  COMPLETED: { label: 'Completed', color: 'text-gray-600 bg-gray-50', icon: <CheckCircle2 size={20} /> },
  CANCELLED: { label: 'Cancelled', color: 'text-red-600 bg-red-50', icon: <Clock size={20} /> },
};

export default function OrderPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const resolvedParams = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders?orderNumber=${resolvedParams.orderNumber}`);
      const data = await res.json();
      if (data.order) {
        setOrder(data.order);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [resolvedParams.orderNumber]);

  useEffect(() => {
    fetchOrder();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchOrder, 30000);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrder();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Coffee size={48} className="mx-auto text-[var(--primary)] animate-pulse" />
          <p className="mt-4 text-gray-500">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Order Not Found</h1>
          <p className="mt-2 text-gray-500">
            We couldn&apos;t find an order with number {resolvedParams.orderNumber}
          </p>
          <a
            href="/"
            className="mt-4 inline-block bg-[var(--primary)] text-white px-6 py-3 rounded-xl font-semibold"
          >
            Back to Menu
          </a>
        </div>
      </div>
    );
  }

  const status = statusConfig[order.status] || statusConfig.PENDING;

  return (
    <main className="min-h-screen pb-8">
      {/* Header */}
      <header className="bg-[var(--primary)] text-white p-4 safe-top">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">Order</p>
            <h1 className="text-xl font-bold">{order.orderNumber}</h1>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30"
          >
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {/* Status card */}
      <div className="px-4 -mt-2">
        <div className={`rounded-xl p-4 ${status.color}`}>
          <div className="flex items-center gap-3">
            {status.icon}
            <div>
              <p className="font-semibold text-lg">{status.label}</p>
              {order.status === 'READY' && (
                <p className="text-sm">Your order is ready! Please collect it from the counter.</p>
              )}
              {order.status === 'PREPARING' && (
                <p className="text-sm">We&apos;re making your coffee. It&apos;ll be ready soon!</p>
              )}
              {order.status === 'CONFIRMED' && (
                <p className="text-sm">Your order is confirmed. We&apos;ll start preparing it shortly.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Order details */}
      <div className="px-4 mt-4 space-y-4">
        {/* Pickup info */}
        <div className="bg-white rounded-xl p-4 border border-[var(--border)]">
          <h2 className="font-semibold mb-3">Pickup Details</h2>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium">{order.pickupLocation.name}</p>
                {order.pickupLocation.address && (
                  <p className="text-sm text-gray-500">{order.pickupLocation.address}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock size={18} className="text-gray-400" />
              <p className="font-medium">{formatDateTime(new Date(order.pickupTime))}</p>
            </div>
          </div>
        </div>

        {/* Customer info */}
        <div className="bg-white rounded-xl p-4 border border-[var(--border)]">
          <h2 className="font-semibold mb-3">Customer Details</h2>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User size={18} className="text-gray-400" />
              <p className="font-medium">{order.customerName}</p>
            </div>

            <div className="flex items-center gap-3">
              <Phone size={18} className="text-gray-400" />
              <p className="font-medium">{order.customerMobile}</p>
            </div>
          </div>
        </div>

        {/* Order items */}
        <div className="bg-white rounded-xl p-4 border border-[var(--border)]">
          <h2 className="font-semibold mb-3">Order Items</h2>

          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-start">
                <div>
                  <p className="font-medium">
                    {item.menuItem.name} <span className="text-gray-500">x{item.quantity}</span>
                  </p>
                  {item.cupNames.filter(Boolean).length > 0 && (
                    <p className="text-sm text-gray-500">
                      Cup names: {item.cupNames.filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
                <p className="font-medium">{formatPrice(item.unitPrice * item.quantity)}</p>
              </div>
            ))}

            <div className="border-t border-[var(--border)] pt-3 flex justify-between">
              <p className="font-semibold">Total</p>
              <p className="font-bold text-[var(--primary)]">{formatPrice(order.totalAmount)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Back to menu */}
      <div className="px-4 mt-6">
        <a
          href="/"
          className="block w-full text-center bg-[var(--primary)] text-white py-3 rounded-xl font-semibold"
        >
          Order More
        </a>
      </div>
    </main>
  );
}
