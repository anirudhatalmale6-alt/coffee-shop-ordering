'use client';

import { useState, useEffect, useCallback } from 'react';
import { Coffee, Clock, MapPin, Phone, User, RefreshCw, CheckCircle2 } from 'lucide-react';
import { formatPrice, formatTime } from '@/lib/utils';

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  cupNames: string[];
  menuItem: {
    name: string;
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
  pickupLocation: {
    name: string;
  };
  items: OrderItem[];
}

const statusColors: Record<string, string> = {
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
  PREPARING: 'bg-orange-100 text-orange-800 border-orange-200',
  READY: 'bg-green-100 text-green-800 border-green-200',
};

const statusLabels: Record<string, string> = {
  CONFIRMED: 'New',
  PREPARING: 'Preparing',
  READY: 'Ready',
};

export default function CounterPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const statusParam = filter !== 'all' ? `&status=${filter}` : '';
      const res = await fetch(`/api/admin/orders?date=${today}${statusParam}`, {
        credentials: 'include',
      });

      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }

      const data = await res.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderId, status: newStatus }),
      });

      if (res.ok) {
        fetchOrders();
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const activeOrders = orders.filter((o) => ['CONFIRMED', 'PREPARING', 'READY'].includes(o.status));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Coffee size={48} className="mx-auto text-[var(--primary)] animate-pulse" />
          <p className="mt-4 text-gray-500">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-[var(--primary)] text-white p-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Coffee size={28} />
            <div>
              <h1 className="text-xl font-bold">Counter Display</h1>
              <p className="text-sm opacity-80">Today&apos;s Orders</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-white/20 text-white rounded-lg px-3 py-2 text-sm border-0
                         focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              <option value="all" className="text-gray-800">All Active</option>
              <option value="CONFIRMED" className="text-gray-800">New</option>
              <option value="PREPARING" className="text-gray-800">Preparing</option>
              <option value="READY" className="text-gray-800">Ready</option>
            </select>

            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              <span className="text-sm">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      {/* Orders grid */}
      <main className="max-w-7xl mx-auto p-4">
        {activeOrders.length === 0 ? (
          <div className="text-center py-12">
            <Coffee size={48} className="mx-auto text-gray-300" />
            <p className="mt-4 text-gray-500 text-lg">No active orders</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={updateOrderStatus}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

interface OrderCardProps {
  order: Order;
  onStatusChange: (orderId: string, status: string) => void;
}

function OrderCard({ order, onStatusChange }: OrderCardProps) {
  const statusClass = statusColors[order.status] || 'bg-gray-100 text-gray-800';

  const getNextStatus = () => {
    if (order.status === 'CONFIRMED') return 'PREPARING';
    if (order.status === 'PREPARING') return 'READY';
    if (order.status === 'READY') return 'COMPLETED';
    return null;
  };

  const nextStatus = getNextStatus();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className={`px-4 py-3 border-b ${statusClass}`}>
        <div className="flex items-center justify-between">
          <span className="font-bold text-lg">{order.orderNumber}</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusClass}`}>
            {statusLabels[order.status] || order.status}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Customer info */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <User size={16} className="text-gray-400" />
            <span className="font-semibold">{order.customerName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={16} className="text-gray-400" />
            <span>{order.customerMobile}</span>
          </div>
        </div>

        {/* Pickup info */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-gray-400" />
            <span>{order.pickupLocation.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-gray-400" />
            <span className="font-medium">{formatTime(new Date(order.pickupTime))}</span>
          </div>
        </div>

        {/* Order items */}
        <div className="border-t border-gray-100 pt-3">
          <h3 className="text-sm font-semibold text-gray-500 mb-2">ORDER ITEMS</h3>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">
                    {item.quantity}x {item.menuItem.name}
                  </span>
                  <span className="text-gray-500">{formatPrice(item.unitPrice * item.quantity)}</span>
                </div>
                {item.cupNames.filter(Boolean).length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {item.cupNames.filter(Boolean).map((name, idx) => (
                      <span
                        key={idx}
                        className="inline-block bg-[var(--accent)]/20 text-[var(--primary)] px-2 py-0.5 rounded text-xs font-medium"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="flex justify-between items-center border-t border-gray-100 pt-3">
          <span className="font-semibold">Total</span>
          <span className="font-bold text-lg text-[var(--primary)]">
            {formatPrice(order.totalAmount)}
          </span>
        </div>

        {/* Action button */}
        {nextStatus && (
          <button
            onClick={() => onStatusChange(order.id, nextStatus)}
            className="w-full flex items-center justify-center gap-2 bg-[var(--primary)] text-white
                       py-3 rounded-xl font-semibold hover:bg-[var(--primary-light)] transition-colors"
          >
            <CheckCircle2 size={18} />
            {nextStatus === 'PREPARING' && 'Start Preparing'}
            {nextStatus === 'READY' && 'Mark as Ready'}
            {nextStatus === 'COMPLETED' && 'Complete Order'}
          </button>
        )}
      </div>
    </div>
  );
}
