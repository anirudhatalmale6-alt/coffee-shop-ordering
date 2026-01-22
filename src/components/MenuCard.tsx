'use client';

import Image from 'next/image';
import { Plus, Minus } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/utils';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
}

export default function MenuCard({ item }: { item: MenuItem }) {
  const { items, addItem, updateQuantity, removeItem } = useCartStore();
  const cartItem = items.find((i) => i.menuItemId === item.id);
  const quantity = cartItem?.quantity || 0;

  const handleAdd = () => {
    addItem({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      image: item.image || undefined,
    });
  };

  const handleIncrement = () => {
    updateQuantity(item.id, quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity <= 1) {
      removeItem(item.id);
    } else {
      updateQuantity(item.id, quantity - 1);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-[var(--border)] flex">
      {/* Image */}
      <div className="w-24 h-24 flex-shrink-0 relative bg-[var(--muted)]">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover"
            sizes="96px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">
            ☕
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-3 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-[var(--foreground)] text-sm leading-tight">
            {item.name}
          </h3>
          {item.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
              {item.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="font-bold text-[var(--primary)]">
            {formatPrice(item.price)}
          </span>

          {quantity === 0 ? (
            <button
              onClick={handleAdd}
              className="bg-[var(--primary)] text-white px-4 py-1.5 rounded-full text-sm font-medium
                         hover:bg-[var(--primary-light)] transition-colors btn-touch"
            >
              ADD
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-[var(--primary)] rounded-full px-1">
              <button
                onClick={handleDecrement}
                className="w-8 h-8 flex items-center justify-center text-white btn-touch"
              >
                <Minus size={16} />
              </button>
              <span className="text-white font-semibold min-w-[20px] text-center">
                {quantity}
              </span>
              <button
                onClick={handleIncrement}
                className="w-8 h-8 flex items-center justify-center text-white btn-touch"
              >
                <Plus size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
