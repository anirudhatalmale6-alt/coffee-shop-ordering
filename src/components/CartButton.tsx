'use client';

import { ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/utils';

interface CartButtonProps {
  onClick: () => void;
}

export default function CartButton({ onClick }: CartButtonProps) {
  const { getTotalItems, getTotal } = useCartStore();
  const itemCount = getTotalItems();

  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 safe-bottom z-30">
      <button
        onClick={onClick}
        className="w-full bg-[var(--primary)] text-white py-4 px-6 rounded-2xl
                   flex items-center justify-between shadow-lg shadow-black/20
                   hover:bg-[var(--primary-light)] transition-colors btn-touch"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <ShoppingBag size={24} />
            <span className="absolute -top-2 -right-2 bg-white text-[var(--primary)] text-xs font-bold
                             w-5 h-5 rounded-full flex items-center justify-center">
              {itemCount}
            </span>
          </div>
          <span className="font-semibold">View Cart</span>
        </div>
        <span className="font-bold text-lg">{formatPrice(getTotal())}</span>
      </button>
    </div>
  );
}
