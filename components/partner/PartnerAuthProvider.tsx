"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

export type PartnerStatus =
  | "PENDING_REVIEW"
  | "RESELLER_ACTIVE"
  | "DROPSHIPPER_ACTIVE"
  | "REJECTED"
  | "SUSPENDED";

export interface PartnerAccount {
  id: string;
  name: string;
  email: string;
  partnerType: "reseller" | "dropshipper";
  status: PartnerStatus;
}

interface PartnerAuthContextValue {
  partner: PartnerAccount | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  setStatus: (status: PartnerStatus) => void;
}

export const PartnerAuthContext = createContext<PartnerAuthContextValue | null>(null);

const STORAGE_KEY = "djaemo-partner-auth";

const MOCK_PARTNER: PartnerAccount = {
  id: "PTN-001",
  name: "Partner D'JAEMO",
  email: "partner@djaemojamurkrispi.com",
  partnerType: "reseller",
  status: "PENDING_REVIEW",
};

export function PartnerAuthProvider({ children }: { children: React.ReactNode }) {
  const [partner, setPartner] = useState<PartnerAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPartner(JSON.parse(stored) as PartnerAccount);
      }
    } catch {
      // ignore
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (email: string, _password: string): Promise<{ success: boolean; error?: string }> => {
      // Simulate network delay
      await new Promise((r) => setTimeout(r, 800));

      if (!email.trim()) {
        return { success: false, error: "Email tidak boleh kosong." };
      }

      const account: PartnerAccount = {
        ...MOCK_PARTNER,
        email: email.trim(),
      };

      setPartner(account);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
      return { success: true };
    },
    [],
  );

  const logout = useCallback(() => {
    setPartner(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const setStatus = useCallback(
    (status: PartnerStatus) => {
      setPartner((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, status };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    },
    [],
  );

  return (
    <PartnerAuthContext.Provider value={{ partner, isLoading, login, logout, setStatus }}>
      {children}
    </PartnerAuthContext.Provider>
  );
}

export function usePartnerAuth() {
  const ctx = useContext(PartnerAuthContext);
  if (!ctx) throw new Error("usePartnerAuth must be used within PartnerAuthProvider");
  return ctx;
}
