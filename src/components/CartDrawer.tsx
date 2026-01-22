'use client';

import { useState } from 'react';
import { X, Minus, Plus, Trash2, User } from 'lucide-react';
import { useCartStore, CartItem } from '@/store/cart';
import { formatPrice } from '@/lib/utils';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export default function CartDrawer({ isOpen, onClose, onCheckout }: CartDrawerProps) {
  const { items, updateQuantity, removeItem, updateCupName, setAllCupNames, getTotal } = useCartStore();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl max-h-[85vh] flex flex-col animate-slide-up safe-bottom">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-bold">Your Cart</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            <X size={24} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Your cart is empty
            </div>
          ) : (
            items.map((item) => (
              <CartItemCard
                key={item.menuItemId}
                item={item}
                onUpdateQuantity={(qty) => updateQuantity(item.menuItemId, qty)}
                onRemove={() => removeItem(item.menuItemId)}
                onUpdateCupName={(idx, name) => updateCupName(item.menuItemId, idx, name)}
                onSetAllNames={(name) => setAllCupNames(item.menuItemId, name)}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t border-[var(--border)] space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total</span>
              <span className="text-xl font-bold text-[var(--primary)]">
                {formatPrice(getTotal())}
              </span>
            </div>
            <button
              onClick={onCheckout}
              className="w-full bg-[var(--primary)] text-white py-3 rounded-xl font-semibold
                         hover:bg-[var(--primary-light)] transition-colors btn-touch"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
  onUpdateCupName: (index: number, name: string) => void;
  onSetAllNames: (name: string) => void;
}

function CartItemCard({
  item,
  onUpdateQuantity,
  onRemove,
  onUpdateCupName,
  onSetAllNames,
}: CartItemCardProps) {
  const [usesameName, setUseSameName] = useState(true);
  const [sameName, setSameName] = useState('');

  const handleSameNameChange = (name: string) => {
    setSameName(name);
    onSetAllNames(name);
  };

  const handleUseSameNameToggle = (value: boolean) => {
    setUseSameName(value);
    if (value && sameName) {
      onSetAllNames(sameName);
    }
  };

  return (
    <div className="bg-[var(--muted)] rounded-xl p-3">
      {/* Item header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h3 className="font-semibold text-sm">{item.name}</h3>
          <p className="text-[var(--primary)] font-medium text-sm">
            {formatPrice(item.price)} each
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quantity controls */}
          <div className="flex items-center gap-1 bg-white rounded-full border border-[var(--border)]">
            <button
              onClick={() => onUpdateQuantity(item.quantity - 1)}
              className="w-8 h-8 flex items-center justify-center text-gray-600 btn-touch"
            >
              <Minus size={14} />
            </button>
            <span className="font-semibold min-w-[20px] text-center text-sm">
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdateQuantity(item.quantity + 1)}
              className="w-8 h-8 flex items-center justify-center text-gray-600 btn-touch"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Remove button */}
          <button
            onClick={onRemove}
            className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-full btn-touch"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Cup names section */}
      <div className="mt-3 pt-3 border-t border-[var(--border)]">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <User size={14} />
          <span>Name on cup(s)</span>
        </div>

        {item.quantity > 1 && (
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => handleUseSameNameToggle(true)}
              className={`text-xs px-3 py-1 rounded-full ${
                usesameName
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-white border border-[var(--border)]'
              }`}
            >
              Same for all
            </button>
            <button
              onClick={() => handleUseSameNameToggle(false)}
              className={`text-xs px-3 py-1 rounded-full ${
                !usesameName
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-white border border-[var(--border)]'
              }`}
            >
              Different names
            </button>
          </div>
        )}

        {usesameName || item.quantity === 1 ? (
          <input
            type="text"
            placeholder="Enter name for cup"
            value={sameName || item.cupNames[0] || ''}
            onChange={(e) => handleSameNameChange(e.target.value)}
            className="w-full px-3 py-2 bg-white rounded-lg border border-[var(--border)] text-sm
                       focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
          />
        ) : (
          <div className="space-y-2">
            {item.cupNames.map((name, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-16">Cup {idx + 1}:</span>
                <input
                  type="text"
                  placeholder="Enter name"
                  value={name}
                  onChange={(e) => onUpdateCupName(idx, e.target.value)}
                  className="flex-1 px-3 py-2 bg-white rounded-lg border border-[var(--border)] text-sm
                             focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Item total */}
      <div className="mt-3 pt-2 flex justify-end">
        <span className="font-bold text-[var(--primary)]">
          {formatPrice(item.price * item.quantity)}
        </span>
      </div>
    </div>
  );
}
