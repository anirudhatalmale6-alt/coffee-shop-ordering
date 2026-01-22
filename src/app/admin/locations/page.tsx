'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, MapPin, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Location {
  id: string;
  name: string;
  address: string | null;
  isActive: boolean;
  sortOrder: number;
}

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/admin/locations', { credentials: 'include' });
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      const data = await res.json();
      setLocations(data.locations || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this location?')) return;

    try {
      await fetch(`/api/admin/locations?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      toast.success('Location deleted');
      fetchLocations();
    } catch {
      toast.error('Failed to delete location');
    }
  };

  const toggleActive = async (location: Location) => {
    try {
      await fetch('/api/admin/locations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: location.id,
          isActive: !location.isActive,
        }),
      });
      fetchLocations();
    } catch {
      toast.error('Failed to update location');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <MapPin size={48} className="text-[var(--primary)] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Pickup Locations</h1>
          <button
            onClick={() => {
              setEditingLocation(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-light)]"
          >
            <Plus size={18} />
            Add Location
          </button>
        </div>

        {/* Locations list */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {locations.length === 0 ? (
            <div className="p-8 text-center">
              <MapPin size={48} className="mx-auto text-gray-300" />
              <p className="mt-4 text-gray-500">No locations yet</p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 text-[var(--primary)] font-medium"
              >
                Add your first location
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className={`flex items-center justify-between p-4 ${!location.isActive ? 'bg-gray-50' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[var(--primary)]/10 rounded-lg flex items-center justify-center">
                      <MapPin size={20} className="text-[var(--primary)]" />
                    </div>
                    <div>
                      <h3 className={`font-medium ${!location.isActive ? 'text-gray-400' : ''}`}>
                        {location.name}
                      </h3>
                      {location.address && (
                        <p className="text-sm text-gray-500">{location.address}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActive(location)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      title={location.isActive ? 'Hide location' : 'Show location'}
                    >
                      {location.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                    <button
                      onClick={() => {
                        setEditingLocation(location);
                        setShowModal(true);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(location.id)}
                      className="p-2 hover:bg-red-50 text-red-500 rounded-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <LocationModal
          location={editingLocation}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            fetchLocations();
          }}
        />
      )}
    </div>
  );
}

interface LocationModalProps {
  location: Location | null;
  onClose: () => void;
  onSave: () => void;
}

function LocationModal({ location, onClose, onSave }: LocationModalProps) {
  const [name, setName] = useState(location?.name || '');
  const [address, setAddress] = useState(location?.address || '');
  const [sortOrder, setSortOrder] = useState(location?.sortOrder || 0);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = '/api/admin/locations';
      const method = location ? 'PATCH' : 'POST';
      const body = location
        ? { id: location.id, name, address, sortOrder }
        : { name, address, sortOrder };

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      toast.success(location ? 'Location updated' : 'Location created');
      onSave();
    } catch {
      toast.error('Failed to save location');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">
            {location ? 'Edit Location' : 'Add Location'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Location Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Main Counter"
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Address (optional)</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g., Ground Floor, Building A"
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
            {location ? 'Update Location' : 'Create Location'}
          </button>
        </form>
      </div>
    </div>
  );
}
