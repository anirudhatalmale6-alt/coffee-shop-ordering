'use client';

import { useState, useEffect } from 'react';
import { Clock, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface TimeSlotConfig {
  id: string;
  startTime: string;
  endTime: string;
  slotDuration: number;
  maxOrdersPerSlot: number;
}

export default function AdminTimeSlotsPage() {
  const [, setConfig] = useState<TimeSlotConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('22:00');
  const [slotDuration, setSlotDuration] = useState(15);
  const [maxOrdersPerSlot, setMaxOrdersPerSlot] = useState(5);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/admin/timeslots', { credentials: 'include' });
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      const data = await res.json();
      if (data.config) {
        setConfig(data.config);
        setStartTime(data.config.startTime);
        setEndTime(data.config.endTime);
        setSlotDuration(data.config.slotDuration);
        setMaxOrdersPerSlot(data.config.maxOrdersPerSlot);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await fetch('/api/admin/timeslots', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          startTime,
          endTime,
          slotDuration,
          maxOrdersPerSlot,
        }),
      });

      toast.success('Settings saved');
      fetchConfig();
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Generate preview slots
  const generatePreviewSlots = () => {
    const slots: string[] = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let current = new Date();
    current.setHours(startHour, startMin, 0, 0);

    const end = new Date();
    end.setHours(endHour, endMin, 0, 0);

    while (current < end && slots.length < 20) {
      const timeStr = current.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      slots.push(timeStr);
      current = new Date(current.getTime() + slotDuration * 60 * 1000);
    }

    return slots;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Clock size={48} className="text-[var(--primary)] animate-pulse" />
      </div>
    );
  }

  const previewSlots = generatePreviewSlots();

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Time Slot Settings</h1>
          <p className="text-gray-500 mt-1">
            Configure when customers can pick up their orders
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Settings form */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Configuration</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Opening Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Closing Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Slot Duration (minutes)
                </label>
                <select
                  value={slotDuration}
                  onChange={(e) => setSlotDuration(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                >
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={20}>20 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  How often pickup slots are available
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Max Orders Per Slot
                </label>
                <input
                  type="number"
                  value={maxOrdersPerSlot}
                  onChange={(e) => setMaxOrdersPerSlot(parseInt(e.target.value))}
                  min={1}
                  max={50}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                />
                <p className="text-xs text-gray-500 mt-1">
                  When this limit is reached, the slot becomes unavailable
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-[var(--primary)] text-white py-3 rounded-lg font-semibold
                           hover:bg-[var(--primary-light)] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                Save Settings
              </button>
            </form>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Slot Preview</h2>
            <p className="text-sm text-gray-500 mb-4">
              This is how time slots will appear to customers
            </p>

            <div className="grid grid-cols-4 gap-2">
              {previewSlots.map((slot, idx) => (
                <div
                  key={idx}
                  className="text-center py-2 px-1 bg-gray-100 rounded-lg text-sm font-medium"
                >
                  {slot}
                </div>
              ))}
            </div>

            {previewSlots.length >= 20 && (
              <p className="text-xs text-gray-400 mt-2 text-center">
                + more slots...
              </p>
            )}

            <div className="mt-6 p-4 bg-[var(--muted)] rounded-lg">
              <h3 className="font-medium text-sm mb-2">Summary</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>
                  Operating hours: {startTime} - {endTime}
                </li>
                <li>
                  Slot interval: {slotDuration} minutes
                </li>
                <li>
                  Capacity per slot: {maxOrdersPerSlot} orders
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
