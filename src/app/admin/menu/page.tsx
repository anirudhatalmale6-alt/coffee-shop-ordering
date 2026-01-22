'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Plus, Edit2, Trash2, Eye, EyeOff, Coffee, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatPrice } from '@/lib/utils';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  isActive: boolean;
  sortOrder: number;
}

interface Category {
  id: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
  items: MenuItem[];
}

export default function AdminMenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  const fetchMenu = async () => {
    try {
      const res = await fetch('/api/admin/menu', { credentials: 'include' });
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching menu:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category and all its items?')) return;

    try {
      await fetch(`/api/admin/menu?type=category&id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      toast.success('Category deleted');
      fetchMenu();
    } catch {
      toast.error('Failed to delete category');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Delete this item?')) return;

    try {
      await fetch(`/api/admin/menu?type=item&id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      toast.success('Item deleted');
      fetchMenu();
    } catch {
      toast.error('Failed to delete item');
    }
  };

  const toggleCategoryActive = async (category: Category) => {
    try {
      await fetch('/api/admin/menu', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: 'category',
          id: category.id,
          isActive: !category.isActive,
        }),
      });
      fetchMenu();
    } catch {
      toast.error('Failed to update category');
    }
  };

  const toggleItemActive = async (item: MenuItem) => {
    try {
      await fetch('/api/admin/menu', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: 'item',
          id: item.id,
          isActive: !item.isActive,
        }),
      });
      fetchMenu();
    } catch {
      toast.error('Failed to update item');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Coffee size={48} className="text-[var(--primary)] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Menu Management</h1>
          <button
            onClick={() => {
              setEditingCategory(null);
              setShowCategoryModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-light)]"
          >
            <Plus size={18} />
            Add Category
          </button>
        </div>

        {/* Categories */}
        <div className="space-y-6">
          {categories.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl">
              <Coffee size={48} className="mx-auto text-gray-300" />
              <p className="mt-4 text-gray-500">No categories yet</p>
              <button
                onClick={() => setShowCategoryModal(true)}
                className="mt-4 text-[var(--primary)] font-medium"
              >
                Add your first category
              </button>
            </div>
          ) : (
            categories.map((category) => (
              <div key={category.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Category header */}
                <div className={`flex items-center justify-between p-4 border-b ${!category.isActive ? 'bg-gray-50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <h2 className={`text-lg font-semibold ${!category.isActive ? 'text-gray-400' : ''}`}>
                      {category.name}
                    </h2>
                    {!category.isActive && (
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Hidden</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedCategoryId(category.id);
                        setEditingItem(null);
                        setShowItemModal(true);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg hover:bg-[var(--primary)]/20"
                    >
                      <Plus size={14} />
                      Add Item
                    </button>
                    <button
                      onClick={() => toggleCategoryActive(category)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      title={category.isActive ? 'Hide category' : 'Show category'}
                    >
                      {category.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                    <button
                      onClick={() => {
                        setEditingCategory(category);
                        setShowCategoryModal(true);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-2 hover:bg-red-50 text-red-500 rounded-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Items */}
                <div className="divide-y divide-gray-100">
                  {category.items.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                      No items in this category
                    </div>
                  ) : (
                    category.items.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-4 ${!item.isActive ? 'bg-gray-50' : ''}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-[var(--muted)] rounded-lg flex items-center justify-center text-xl relative overflow-hidden">
                            {item.image ? (
                              <Image src={item.image} alt={item.name} fill className="object-cover" sizes="48px" />
                            ) : '☕'}
                          </div>
                          <div>
                            <h3 className={`font-medium ${!item.isActive ? 'text-gray-400' : ''}`}>
                              {item.name}
                            </h3>
                            {item.description && (
                              <p className="text-sm text-gray-500 line-clamp-1">{item.description}</p>
                            )}
                            <p className="text-sm font-semibold text-[var(--primary)]">
                              {formatPrice(item.price)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleItemActive(item)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                          >
                            {item.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCategoryId(category.id);
                              setEditingItem(item);
                              setShowItemModal(true);
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-2 hover:bg-red-50 text-red-500 rounded-lg"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          onClose={() => setShowCategoryModal(false)}
          onSave={() => {
            setShowCategoryModal(false);
            fetchMenu();
          }}
        />
      )}

      {/* Item Modal */}
      {showItemModal && (
        <ItemModal
          item={editingItem}
          categoryId={selectedCategoryId}
          onClose={() => setShowItemModal(false)}
          onSave={() => {
            setShowItemModal(false);
            fetchMenu();
          }}
        />
      )}
    </div>
  );
}

interface CategoryModalProps {
  category: Category | null;
  onClose: () => void;
  onSave: () => void;
}

function CategoryModal({ category, onClose, onSave }: CategoryModalProps) {
  const [name, setName] = useState(category?.name || '');
  const [sortOrder, setSortOrder] = useState(category?.sortOrder || 0);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = '/api/admin/menu';
      const method = category ? 'PATCH' : 'POST';
      const body = category
        ? { type: 'category', id: category.id, name, sortOrder }
        : { type: 'category', name, sortOrder };

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      toast.success(category ? 'Category updated' : 'Category created');
      onSave();
    } catch {
      toast.error('Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">
            {category ? 'Edit Category' : 'Add Category'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Category Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Sort Order</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[var(--primary)] text-white py-3 rounded-lg font-semibold
                       hover:bg-[var(--primary-light)] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={18} className="animate-spin" />}
            {category ? 'Update Category' : 'Create Category'}
          </button>
        </form>
      </div>
    </div>
  );
}

interface ItemModalProps {
  item: MenuItem | null;
  categoryId: string;
  onClose: () => void;
  onSave: () => void;
}

function ItemModal({ item, categoryId, onClose, onSave }: ItemModalProps) {
  const [name, setName] = useState(item?.name || '');
  const [description, setDescription] = useState(item?.description || '');
  const [price, setPrice] = useState(item?.price?.toString() || '');
  const [image, setImage] = useState(item?.image || '');
  const [sortOrder, setSortOrder] = useState(item?.sortOrder || 0);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = '/api/admin/menu';
      const method = item ? 'PATCH' : 'POST';
      const body = item
        ? { type: 'item', id: item.id, name, description, price, image, sortOrder }
        : { type: 'item', categoryId, name, description, price, image, sortOrder };

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      toast.success(item ? 'Item updated' : 'Item created');
      onSave();
    } catch {
      toast.error('Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-bold">
            {item ? 'Edit Item' : 'Add Item'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Item Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Price (₹)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              min="0"
              step="1"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Image URL (optional)</label>
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Sort Order</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[var(--primary)] text-white py-3 rounded-lg font-semibold
                       hover:bg-[var(--primary-light)] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={18} className="animate-spin" />}
            {item ? 'Update Item' : 'Create Item'}
          </button>
        </form>
      </div>
    </div>
  );
}
