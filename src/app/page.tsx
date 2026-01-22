'use client';

import { useState, useEffect } from 'react';
import { Coffee, Search } from 'lucide-react';
import MenuCard from '@/components/MenuCard';
import CartButton from '@/components/CartButton';
import CartDrawer from '@/components/CartDrawer';
import CheckoutModal from '@/components/CheckoutModal';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
}

interface Category {
  id: string;
  name: string;
  items: MenuItem[];
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const res = await fetch('/api/menu');
      const data = await res.json();
      setCategories(data.categories || []);
      if (data.categories?.length > 0) {
        setActiveCategory(data.categories[0].id);
      }
    } catch (error) {
      console.error('Error fetching menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.map((category) => ({
    ...category,
    items: category.items.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((category) => category.items.length > 0);

  const handleCheckout = () => {
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Coffee size={48} className="mx-auto text-[var(--primary)] animate-pulse" />
          <p className="mt-4 text-gray-500">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[var(--background)]">
        <div className="px-4 py-4 safe-top">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--primary)] rounded-full flex items-center justify-center">
              <Coffee size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Coffee Shop</h1>
              <p className="text-xs text-gray-500">Order & Pickup</p>
            </div>
          </div>

          {/* Search bar */}
          <div className="mt-4 relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-[var(--border)]
                         focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
            />
          </div>
        </div>

        {/* Category tabs */}
        {!searchQuery && categories.length > 0 && (
          <div className="px-4 pb-3 overflow-x-auto no-scrollbar">
            <div className="flex gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setActiveCategory(category.id);
                    document.getElementById(category.id)?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    });
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    activeCategory === category.id
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-white text-gray-600 border border-[var(--border)]'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Menu content */}
      <div className="px-4 py-2">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No items found</p>
          </div>
        ) : (
          filteredCategories.map((category) => (
            <section key={category.id} id={category.id} className="mb-6">
              <h2 className="text-lg font-bold mb-3 sticky top-[160px] bg-[var(--background)] py-2 z-10">
                {category.name}
              </h2>
              <div className="space-y-3">
                {category.items.map((item) => (
                  <MenuCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {/* Cart button */}
      <CartButton onClick={() => setCartOpen(true)} />

      {/* Cart drawer */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={handleCheckout}
      />

      {/* Checkout modal */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
      />
    </main>
  );
}
