import { create } from 'zustand';
import { cartApi } from '../api';
import type { Cart } from '../types';

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  fetch: () => Promise<void>;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateItem: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clear: () => Promise<void>;
}

export const useCartStore = create<CartState>((set) => ({
  cart: null,
  isLoading: false,

  fetch: async () => {
    try {
      const res = await cartApi.get();
      set({ cart: res.data.data ?? null });
    } catch {
      // silent
    }
  },

  addItem: async (productId, quantity = 1, lat?: number, lng?: number) => {
    try {
      const res = await cartApi.addItem(productId, quantity, lat, lng);
      set({ cart: res.data.data ?? null });
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to add item');
    }
  },

  updateItem: async (productId, quantity) => {
    try {
      const res = await cartApi.updateItem(productId, quantity);
      set({ cart: res.data.data ?? null });
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to update item');
    }
  },

  removeItem: async (productId) => {
    try {
      const res = await cartApi.removeItem(productId);
      set({ cart: res.data.data ?? null });
    } catch {
      // silent
    }
  },

  clear: async () => {
    await cartApi.clear();
    set({ cart: null });
  },
}));
