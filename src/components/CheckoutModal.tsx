'use client';

import { useState, useEffect } from 'react';
import { X, MapPin, Clock, User, Phone, ChevronRight, Loader2 } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Location {
  id: string;
  name: string;
  address: string | null;
}

interface TimeSlot {
  time: string;
  available: boolean;
  displayTime: string;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name: string;
    contact: string;
  };
  theme: {
    color: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export default function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const {
    items,
    customerName,
    customerMobile,
    pickupLocationId,
    pickupTime,
    setCustomerInfo,
    setPickupLocation,
    setPickupTime,
    getTotal,
    clearCart,
  } = useCartStore();

  const [step, setStep] = useState(1);
  const [locations, setLocations] = useState<Location[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Form state
  const [name, setName] = useState(customerName);
  const [mobile, setMobile] = useState(customerMobile);
  const [selectedLocation, setSelectedLocation] = useState(pickupLocationId);
  const [selectedTime, setSelectedTime] = useState(pickupTime);

  useEffect(() => {
    if (isOpen) {
      fetchLocations();
      fetchTimeSlots();
      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, [isOpen]);

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/locations');
      const data = await res.json();
      setLocations(data.locations || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchTimeSlots = async () => {
    try {
      const res = await fetch('/api/timeslots');
      const data = await res.json();
      setTimeSlots(data.slots || []);
    } catch (error) {
      console.error('Error fetching time slots:', error);
    }
  };

  const validateStep1 = () => {
    if (!name.trim()) {
      toast.error('Please enter your name');
      return false;
    }
    if (!mobile.match(/^[6-9]\d{9}$/)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!selectedLocation) {
      toast.error('Please select a pickup location');
      return false;
    }
    if (!selectedTime) {
      toast.error('Please select a pickup time');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setCustomerInfo(name.trim(), mobile);
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setPickupLocation(selectedLocation);
      setPickupTime(selectedTime);
      setStep(3);
    }
  };

  const handlePayment = async () => {
    setProcessingPayment(true);

    try {
      // Create order
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name.trim(),
          customerMobile: mobile,
          pickupLocationId: selectedLocation,
          pickupTime: selectedTime,
          items: items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            cupNames: item.cupNames.map((n) => n.trim() || name.trim()),
          })),
        }),
      });

      if (!orderRes.ok) {
        const error = await orderRes.json();
        throw new Error(error.error || 'Failed to create order');
      }

      const orderData = await orderRes.json();

      // Initialize Razorpay
      const options: RazorpayOptions = {
        key: orderData.razorpayKeyId,
        amount: orderData.amount,
        currency: 'INR',
        name: 'Coffee Shop',
        description: `Order ${orderData.order.orderNumber}`,
        order_id: orderData.razorpayOrderId,
        handler: async function (response: RazorpayResponse) {
          try {
            // Verify payment
            const verifyRes = await fetch('/api/orders/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (!verifyRes.ok) {
              throw new Error('Payment verification failed');
            }

            // Success!
            clearCart();
            window.location.href = `/order/${orderData.order.orderNumber}`;
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: name.trim(),
          contact: mobile,
        },
        theme: {
          color: '#6B4423',
        },
        modal: {
          ondismiss: function () {
            setProcessingPayment(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process payment');
      setProcessingPayment(false);
    }
  };

  if (!isOpen) return null;

  const selectedLocationName = locations.find((l) => l.id === selectedLocation)?.name;
  const selectedTimeDisplay = timeSlots.find((t) => t.time === selectedTime)?.displayTime;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl max-h-[90vh] flex flex-col animate-slide-up safe-bottom">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-lg font-bold">Checkout</h2>
            <p className="text-sm text-gray-500">Step {step} of 3</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-200">
          <div
            className="h-full bg-[var(--primary)] transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Your Details</h3>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  <User size={14} className="inline mr-1" />
                  Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--muted)] rounded-xl border border-[var(--border)]
                             focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  <Phone size={14} className="inline mr-1" />
                  Mobile Number
                </label>
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full px-4 py-3 bg-[var(--muted)] rounded-xl border border-[var(--border)]
                             focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {/* Location selection */}
              <div>
                <h3 className="font-semibold text-lg mb-3">
                  <MapPin size={18} className="inline mr-1" />
                  Pickup Location
                </h3>
                <div className="space-y-2">
                  {locations.map((location) => (
                    <button
                      key={location.id}
                      onClick={() => setSelectedLocation(location.id)}
                      className={`w-full p-4 rounded-xl border text-left transition-all ${
                        selectedLocation === location.id
                          ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                          : 'border-[var(--border)] bg-white'
                      }`}
                    >
                      <span className="font-medium">{location.name}</span>
                      {location.address && (
                        <p className="text-sm text-gray-500 mt-1">{location.address}</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time selection */}
              <div>
                <h3 className="font-semibold text-lg mb-3">
                  <Clock size={18} className="inline mr-1" />
                  Pickup Time (Today)
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => slot.available && setSelectedTime(slot.time)}
                      disabled={!slot.available}
                      className={`py-2 px-1 rounded-lg text-sm font-medium transition-all ${
                        selectedTime === slot.time
                          ? 'bg-[var(--primary)] text-white'
                          : slot.available
                          ? 'bg-white border border-[var(--border)] hover:border-[var(--primary)]'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {slot.displayTime}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Order Summary</h3>

              {/* Customer info */}
              <div className="bg-[var(--muted)] rounded-xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name</span>
                  <span className="font-medium">{name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mobile</span>
                  <span className="font-medium">{mobile}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pickup Location</span>
                  <span className="font-medium">{selectedLocationName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pickup Time</span>
                  <span className="font-medium">{selectedTimeDisplay}</span>
                </div>
              </div>

              {/* Order items */}
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.menuItemId}
                    className="flex justify-between items-start p-3 bg-white rounded-xl border border-[var(--border)]"
                  >
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-gray-500 ml-2">x{item.quantity}</span>
                      <div className="text-xs text-gray-500 mt-1">
                        {item.cupNames.filter(Boolean).length > 0 ? (
                          <>Names: {item.cupNames.filter(Boolean).join(', ')}</>
                        ) : (
                          <>Name: {name}</>
                        )}
                      </div>
                    </div>
                    <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="flex justify-between items-center p-4 bg-[var(--primary)]/5 rounded-xl">
                <span className="font-semibold">Total Amount</span>
                <span className="text-xl font-bold text-[var(--primary)]">
                  {formatPrice(getTotal())}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border)] flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-3 rounded-xl font-semibold border border-[var(--border)]
                         hover:bg-gray-50 transition-colors btn-touch"
            >
              Back
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={handleNext}
              className="flex-1 bg-[var(--primary)] text-white py-3 rounded-xl font-semibold
                         hover:bg-[var(--primary-light)] transition-colors btn-touch flex items-center justify-center gap-2"
            >
              Continue
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handlePayment}
              disabled={processingPayment}
              className="flex-1 bg-[var(--primary)] text-white py-3 rounded-xl font-semibold
                         hover:bg-[var(--primary-light)] transition-colors btn-touch flex items-center justify-center gap-2
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processingPayment ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>Pay {formatPrice(getTotal())}</>
              )}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
