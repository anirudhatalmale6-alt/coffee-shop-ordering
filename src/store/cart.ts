import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  cupNames: string[]; // One name per cup
}

interface CartState {
  items: CartItem[];
  customerName: string;
  customerMobile: string;
  pickupLocationId: string;
  pickupTime: string;

  // Actions
  addItem: (item: Omit<CartItem, 'quantity' | 'cupNames'>) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  updateCupName: (menuItemId: string, index: number, name: string) => void;
  setAllCupNames: (menuItemId: string, name: string) => void;
  setCustomerInfo: (name: string, mobile: string) => void;
  setPickupLocation: (locationId: string) => void;
  setPickupTime: (time: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      customerName: '',
      customerMobile: '',
      pickupLocationId: '',
      pickupTime: '',

      addItem: (item) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) => i.menuItemId === item.menuItemId
          );

          if (existingIndex >= 0) {
            const newItems = [...state.items];
            newItems[existingIndex].quantity += 1;
            newItems[existingIndex].cupNames.push('');
            return { items: newItems };
          }

          return {
            items: [...state.items, { ...item, quantity: 1, cupNames: [''] }],
          };
        });
      },

      removeItem: (menuItemId) => {
        set((state) => ({
          items: state.items.filter((i) => i.menuItemId !== menuItemId),
        }));
      },

      updateQuantity: (menuItemId, quantity) => {
        if (quantity < 1) {
          get().removeItem(menuItemId);
          return;
        }

        set((state) => {
          const newItems = state.items.map((item) => {
            if (item.menuItemId === menuItemId) {
              const currentNames = item.cupNames;
              let newNames: string[];

              if (quantity > currentNames.length) {
                // Add more names
                newNames = [
                  ...currentNames,
                  ...Array(quantity - currentNames.length).fill(''),
                ];
              } else {
                // Remove names from end
                newNames = currentNames.slice(0, quantity);
              }

              return { ...item, quantity, cupNames: newNames };
            }
            return item;
          });

          return { items: newItems };
        });
      },

      updateCupName: (menuItemId, index, name) => {
        set((state) => ({
          items: state.items.map((item) => {
            if (item.menuItemId === menuItemId) {
              const newNames = [...item.cupNames];
              newNames[index] = name;
              return { ...item, cupNames: newNames };
            }
            return item;
          }),
        }));
      },

      setAllCupNames: (menuItemId, name) => {
        set((state) => ({
          items: state.items.map((item) => {
            if (item.menuItemId === menuItemId) {
              return {
                ...item,
                cupNames: item.cupNames.map(() => name),
              };
            }
            return item;
          }),
        }));
      },

      setCustomerInfo: (name, mobile) => {
        set({ customerName: name, customerMobile: mobile });
      },

      setPickupLocation: (locationId) => {
        set({ pickupLocationId: locationId });
      },

      setPickupTime: (time) => {
        set({ pickupTime: time });
      },

      clearCart: () => {
        set({
          items: [],
          customerName: '',
          customerMobile: '',
          pickupLocationId: '',
          pickupTime: '',
        });
      },

      getTotal: () => {
        return get().items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
      },

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'coffee-cart',
    }
  )
);
