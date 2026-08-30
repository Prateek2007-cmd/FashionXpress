import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const API = import.meta.env.VITE_API_URL ?? '';

export interface ServiceablePincode {
  id: number;
  pincode: string;
  area: string;
  city: string;
  state: string;
  isActive: boolean;
}

interface PincodeContextValue {
  selectedPincode: string | null;
  selectedPincodeInfo: ServiceablePincode | null;
  availablePincodes: ServiceablePincode[];
  loadingPincodes: boolean;
  setPincode: (pincode: string | null) => void;
  clearPincode: () => void;
}

const PincodeContext = createContext<PincodeContextValue | null>(null);

const STORAGE_KEY = 'tfx_selected_pincode';

export function PincodeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [availablePincodes, setAvailablePincodes] = useState<ServiceablePincode[]>([]);
  const [loadingPincodes, setLoadingPincodes] = useState(true);
  const [selectedPincode, setSelectedPincode] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY) ?? null;
  });

  // Fetch all active pincodes on mount
  useEffect(() => {
    fetch(`${API}/api/pincodes`)
      .then((r) => r.json())
      .then((data: ServiceablePincode[]) => {
        setAvailablePincodes(Array.isArray(data) ? data : []);
        setLoadingPincodes(false);
      })
      .catch(() => setLoadingPincodes(false));
  }, []);

  // Sync with user profile pincode when logged in
  useEffect(() => {
    if (user && (user as any).pincode) {
      const userPincode = (user as any).pincode as string;
      setSelectedPincode(userPincode);
      localStorage.setItem(STORAGE_KEY, userPincode);
    }
  }, [user]);

  const setPincode = useCallback((pincode: string | null) => {
    setSelectedPincode(pincode);
    if (pincode) {
      localStorage.setItem(STORAGE_KEY, pincode);
      // If logged in, save to profile
      const token = localStorage.getItem('token');
      if (token) {
        fetch(`${API}/api/auth/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ pincode }),
        }).catch(() => {});
      }
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const clearPincode = useCallback(() => setPincode(null), [setPincode]);

  const selectedPincodeInfo = availablePincodes.find((p) => p.pincode === selectedPincode) ?? null;

  return (
    <PincodeContext.Provider value={{
      selectedPincode,
      selectedPincodeInfo,
      availablePincodes,
      loadingPincodes,
      setPincode,
      clearPincode,
    }}>
      {children}
    </PincodeContext.Provider>
  );
}

export function usePincode() {
  const ctx = useContext(PincodeContext);
  if (!ctx) throw new Error('usePincode must be used inside PincodeProvider');
  return ctx;
}
