import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function getTimeSlots(
  startTime: string,
  endTime: string,
  slotDuration: number,
  bookedSlots: Map<string, number>,
  maxOrdersPerSlot: number
): { time: string; available: boolean; displayTime: string }[] {
  const slots: { time: string; available: boolean; displayTime: string }[] = [];
  const now = new Date();

  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startDate = new Date();
  startDate.setHours(startHour, startMin, 0, 0);

  const endDate = new Date();
  endDate.setHours(endHour, endMin, 0, 0);

  // Start from next available slot (at least 15 min from now)
  const minPickupTime = new Date(now.getTime() + 15 * 60 * 1000);

  let current = new Date(startDate);
  while (current < endDate) {
    const timeStr = `${current.getHours().toString().padStart(2, '0')}:${current.getMinutes().toString().padStart(2, '0')}`;
    const booked = bookedSlots.get(timeStr) || 0;
    const isPast = current < minPickupTime;
    const isFull = booked >= maxOrdersPerSlot;

    slots.push({
      time: timeStr,
      available: !isPast && !isFull,
      displayTime: formatTime(current),
    });

    current = new Date(current.getTime() + slotDuration * 60 * 1000);
  }

  return slots;
}
