import { create } from 'zustand';
import { storeApi } from '../api';
import type { Store } from '../types';

interface StoreState {
  currentStore: Store | null;
  availableStores: Store[];
  location: { lat: number; lng: number } | null;
  loading: boolean;
  notServiceable: boolean;
  detectStore: (lat: number, lng: number) => Promise<void>;
  setStore: (store: Store) => void;
  clearStore: () => void;
}

export const useStoreStore = create<StoreState>((set, get) => ({
  currentStore: null,
  availableStores: [],
  location: null,
  loading: false,
  notServiceable: false,

  detectStore: async (lat, lng) => {
    set({ loading: true, location: { lat, lng }, notServiceable: false });
    try {
      const res = await storeApi.nearby(lat, lng);
      const stores: Store[] = res.data.data || [];
      if (stores.length === 0) {
        set({ currentStore: null, availableStores: [], loading: false, notServiceable: true });
        return;
      }
      set({ currentStore: stores[0], availableStores: stores, loading: false, notServiceable: false });
    } catch {
      set({ loading: false, notServiceable: true });
    }
  },

  setStore: (store) => {
    set({ currentStore: store, notServiceable: false });
  },

  clearStore: () => {
    set({ currentStore: null, availableStores: [], location: null, notServiceable: false });
  },
}));
