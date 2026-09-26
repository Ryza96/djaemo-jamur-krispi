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
  username: string;
}

interface PartnerApiAccount {
  id: string;
  full_name: string;
  username: string;
  partner_type: "reseller" | "dropshipper";
  status: PartnerStatus;
  email: string | null;
}

interface PartnerAuthContextValue {
  partner: PartnerAccount | null;
  isLoading: boolean;
  login: (
    identifier: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

export const PartnerAuthContext = createContext<PartnerAuthContextValue | null>(null);

const GENERIC_LOGIN_ERROR = "Terjadi kesalahan. Silakan coba lagi.";

function mapPartnerAccount(data: PartnerApiAccount): PartnerAccount {
  return {
    id: data.id,
    name: data.full_name,
    email: data.email ?? "",
    partnerType: data.partner_type,
    status: data.status,
    username: data.username,
  };
}

export function PartnerAuthProvider({ children }: { children: React.ReactNode }) {
  const [partner, setPartner] = useState<PartnerAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const res = await fetch("/api/partner/me", {
          credentials: "include",
          cache: "no-store",
        });

        if (res.status === 401) {
          if (!cancelled) setPartner(null);
          return;
        }

        if (!res.ok) {
          if (!cancelled) setPartner(null);
          return;
        }

        const body = (await res.json()) as {
          success?: boolean;
          data?: PartnerApiAccount;
        };

        if (!cancelled && body.success && body.data) {
          setPartner(mapPartnerAccount(body.data));
        } else if (!cancelled) {
          setPartner(null);
        }
      } catch {
        if (!cancelled) setPartner(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (
      identifier: string,
      password: string,
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch("/api/partner/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ identifier, password }),
        });

        const body = (await res.json()) as {
          success?: boolean;
          data?: PartnerApiAccount;
          error?: string;
        };

        if (res.status === 401) {
          return {
            success: false,
            error: body.error ?? "Username atau password salah.",
          };
        }

        if (!res.ok || !body.success || !body.data) {
          return { success: false, error: GENERIC_LOGIN_ERROR };
        }

        setPartner(mapPartnerAccount(body.data));
        return { success: true };
      } catch {
        return { success: false, error: GENERIC_LOGIN_ERROR };
      }
    },
    [],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await fetch("/api/partner/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Local state must still be cleared when the network request fails.
    } finally {
      setPartner(null);
    }
  }, []);

  return (
    <PartnerAuthContext.Provider value={{ partner, isLoading, login, logout }}>
      {children}
    </PartnerAuthContext.Provider>
  );
}

export function usePartnerAuth() {
  const ctx = useContext(PartnerAuthContext);
  if (!ctx) throw new Error("usePartnerAuth must be used within PartnerAuthProvider");
  return ctx;
}
