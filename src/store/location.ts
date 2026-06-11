import * as Location from 'expo-location';
import { create } from 'zustand';
import { useStoreStore } from './store';

interface LocationState {
  lat: number | null;
  lng: number | null;
  address: string | null;
  loading: boolean;
  error: string | null;
  requestLocation: () => Promise<void>;
}

export const useLocationStore = create<LocationState>((set) => ({
  lat: null,
  lng: null,
  address: null,
  loading: false,
  error: null,

  requestLocation: async () => {
    set({ loading: true, error: null });
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        set({ loading: false, error: 'Location permission denied' });
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [reverse] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      const address = reverse
        ? [reverse.street, reverse.district, reverse.city].filter(Boolean).join(', ')
        : 'Current Location';
      set({ lat: loc.coords.latitude, lng: loc.coords.longitude, address, loading: false });

      // Auto-detect nearest serving store
      useStoreStore.getState().detectStore(loc.coords.latitude, loc.coords.longitude);
    } catch (err: any) {
      set({ loading: false, error: err.message || 'Failed to get location' });
    }
  },
}));
