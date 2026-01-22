'use client';

import { useState, useEffect, useCallback } from 'react';
import { Coffee, Clock, MapPin, Phone, User, RefreshCw, Search, Calendar } from 'lucide-react';
import { formatPrice, formatTime, formatDateTime } from '@/lib/utils';

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
  paymentStatus: string;
  createdAt: string;
  pickupLocation: {
    name: string;
  };
  items: OrderItem[];
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PREPARING: 'bg-orange-100 text-orange-800',
  READY: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const statusParam = filter !== 'all' ? `&status=${filter}` : '';
      const res = await fetch(`/api/admin/orders?date=${date}${statusParam}`, {
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
  }, [filter, date]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const filteredOrders = orders.filter((order) =>
    order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
    order.customerName.toLowerCase().includes(search.toLowerCase()) ||
    order.customerMobile.includes(search)
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Coffee size={48} className="text-[var(--primary)] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">Orders</h1>

          <div className="flex flex-wrap items-center gap-3">
            {/* Date picker */}
            <div className="relative">
              <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
              />
            </div>

            {/* Status filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
            >
              <option value="all">All Statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PREPARING">Preparing</option>
              <option value="READY">Ready</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-light)]"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order number, name, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
          />
        </div>

        {/* Orders table */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <Coffee size={48} className="mx-auto text-gray-300" />
            <p className="mt-4 text-gray-500">No orders found</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Order</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Items</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Pickup</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-sm">{order.orderNumber}</div>
                        <div className="text-xs text-gray-500">{formatDateTime(new Date(order.createdAt))}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-sm">
                          <User size={14} className="text-gray-400" />
                          {order.customerName}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Phone size={12} className="text-gray-400" />
                          {order.customerMobile}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="text-sm">
                            {item.quantity}x {item.menuItem.name}
                            {item.cupNames.filter(Boolean).length > 0 && (
                              <span className="text-xs text-gray-500 ml-1">
                                ({item.cupNames.filter(Boolean).join(', ')})
                              </span>
                            )}
                          </div>
                        ))}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin size={14} className="text-gray-400" />
                          {order.pickupLocation.name}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock size={12} className="text-gray-400" />
                          {formatTime(new Date(order.pickupTime))}
                        </div>
                      </td>
                      <td className="px-4 py-4 font-semibold">
                        {formatPrice(order.totalAmount)}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none"
                        >
                          <option value="CONFIRMED">Confirmed</option>
                          <option value="PREPARING">Preparing</option>
                          <option value="READY">Ready</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
