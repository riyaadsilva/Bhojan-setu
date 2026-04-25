import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { clearAuthToken, fetchMe, hasAuthToken, loginUser, registerUser, saveAuthToken } from "../services/api";
import { debugError, debugLog, debugWarn } from "../services/debug";

export type UserRole = "individual" | "restaurant" | "ngo";

export interface UserProfile {
  [key: string]: string;
}

export interface FoodDonation {
  id: string;
  _id?: string;
  donorType: "individual" | "restaurant";
  donorName: string;
  donorPhone: string;
  donorLocation: string;
  pickupAddress?: string;
  pickupLat?: number;
  pickupLng?: number;
  totalPrepared: string;
  remaining: string;
  category: "junk" | "normal" | "healthy";
  description: string;
  photo?: string; // data URL
  createdAt: string;
  status: "pending" | "accepted" | "denied" | "in_transit" | "delivered" | "cancelled";
  fulfillmentType?: "pickup" | "delivery" | null;
  acceptedByNgo?: any;
  acceptedAt?: string;
  deniedAt?: string;
  deliveredAt?: string;
  completionConfirmed?: boolean;
  completionNote?: string;
  pickupConfirmedByNgo?: boolean;
  deliveryConfirmedByNgo?: boolean;
  ngoActionHistory?: Array<{
    action: string;
    actor?: any;
    actorRole?: string;
    status?: string;
    fulfillmentType?: "pickup" | "delivery" | null;
    note?: string;
    createdAt?: string;
  }>;
  rating?: number;
}

interface UserState {
  role: UserRole | null;
  profile: UserProfile;
  isLoggedIn: boolean;
  authReady: boolean;
  donations: FoodDonation[];
}

interface UserContextType extends UserState {
  login: (role: UserRole, profile: UserProfile, mode?: "login" | "register") => Promise<void>;
  logout: () => void;
  addDonation: (d: Omit<FoodDonation, "id" | "createdAt" | "status">) => void;
  updateDonation: (id: string, patch: Partial<FoodDonation>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEY = "bhojansetu_user";
const DONATIONS_KEY = "bhojansetu_donations";

const seedDonations = (): FoodDonation[] => [
  {
    id: "d1",
    donorType: "restaurant",
    donorName: "Spice Kitchen",
    donorPhone: "+91 98765 43210",
    donorLocation: "Bandra West, Mumbai",
    pickupAddress: "Bandra West, Mumbai, Maharashtra",
    pickupLat: 19.0596,
    pickupLng: 72.8295,
    totalPrepared: "120 kg",
    remaining: "18 kg",
    category: "healthy",
    description: "Veg biryani, dal makhani, and roti — packed and ready for pickup.",
    photo: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    status: "pending",
    fulfillmentType: null,
    ngoActionHistory: [],
  },
  {
    id: "d2",
    donorType: "individual",
    donorName: "Priya Sharma",
    donorPhone: "+91 91234 56789",
    donorLocation: "Andheri East, Mumbai",
    pickupAddress: "Andheri East, Mumbai, Maharashtra",
    pickupLat: 19.1136,
    pickupLng: 72.8697,
    totalPrepared: "Wedding party — 200 plates",
    remaining: "35 plates",
    category: "normal",
    description: "Paneer curry, jeera rice, salad and sweets from a wedding reception.",
    photo: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    status: "in_transit",
    fulfillmentType: "pickup",
    acceptedAt: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
    acceptedByNgo: {
      profile: { ngoName: "Roti Bank Foundation" },
      email: "contact@rotibank.org",
    },
    ngoActionHistory: [
      { action: "accepted", actorRole: "ngo", status: "accepted", createdAt: new Date(Date.now() - 1000 * 60 * 75).toISOString() },
      { action: "fulfillment_selected", actorRole: "ngo", status: "in_transit", fulfillmentType: "pickup", createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
    ],
    rating: 5,
  },
  {
    id: "d3",
    donorType: "restaurant",
    donorName: "Royal Caterers",
    donorPhone: "+91 99887 76655",
    donorLocation: "Powai, Mumbai",
    pickupAddress: "Powai, Mumbai, Maharashtra",
    pickupLat: 19.1176,
    pickupLng: 72.906,
    totalPrepared: "300 kg corporate lunch",
    remaining: "42 kg",
    category: "normal",
    description: "Mixed Indian thali items — sealed containers, fresh from this afternoon.",
    photo: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    status: "delivered",
    fulfillmentType: "delivery",
    acceptedAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    deliveredAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    acceptedByNgo: {
      profile: { ngoName: "Helping Hands Society" },
      email: "hello@helpinghands.org.in",
    },
    completionConfirmed: true,
    deliveryConfirmedByNgo: true,
    completionNote: "Meals were redistributed to the evening shelter route in Powai.",
    ngoActionHistory: [
      { action: "accepted", actorRole: "ngo", status: "accepted", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString() },
      { action: "fulfillment_selected", actorRole: "ngo", status: "in_transit", fulfillmentType: "delivery", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 19).toISOString() },
      { action: "completed", actorRole: "ngo", status: "delivered", fulfillmentType: "delivery", note: "Meals were redistributed to the evening shelter route in Powai.", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString() },
    ],
    rating: 4,
  },
];

export function UserProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UserState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const donations = localStorage.getItem(DONATIONS_KEY);
      const base = saved ? JSON.parse(saved) : { role: null, profile: {}, isLoggedIn: false };
      return {
        ...base,
        authReady: false,
        donations: donations ? JSON.parse(donations) : seedDonations(),
      };
    } catch {}
    return { role: null, profile: {}, isLoggedIn: false, authReady: false, donations: seedDonations() };
  });

  useEffect(() => {
    const { donations, ...rest } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
    localStorage.setItem(DONATIONS_KEY, JSON.stringify(donations));
  }, [state]);

  useEffect(() => {
    let cancelled = false;
    if (!hasAuthToken()) {
      debugLog("auth:restore_skipped_no_token");
      setState((s) => ({ ...s, authReady: true }));
      return () => {
        cancelled = true;
      };
    }

    fetchMe()
      .then(({ user }) => {
        if (cancelled || !user?.role) return;
        debugLog("auth:restore_success", { role: user.role, userId: user.id });
        setState((s) => ({
          ...s,
          role: user.role,
          profile: { ...user.profile, id: user.id, email: user.email },
          isLoggedIn: true,
          authReady: true,
        }));
      })
      .catch(() => {
        if (!cancelled) {
          debugWarn("auth:restore_failed");
          setState((s) => ({ ...s, authReady: true }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login: UserContextType["login"] = async (role, profile, mode = "register") => {
    const cleanProfile = { ...profile, role };
    debugLog("auth:submit", { role, mode, email: profile.email });

    try {
      const payload =
        mode === "login"
          ? await loginUser({ email: profile.email, password: profile.password, role })
          : await registerUser(cleanProfile);

      saveAuthToken(payload.token);
      debugLog("auth:submit_success", { role: payload.user.role, userId: payload.user.id, mode });
      setState((s) => ({
        ...s,
        role: payload.user.role,
        profile: { ...payload.user.profile, id: payload.user.id, email: payload.user.email } || { ...profile, id: payload.user.id, email: payload.user.email },
        isLoggedIn: true,
        authReady: true,
      }));
    } catch (error) {
      debugError("auth:submit_failed", { role, mode, message: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  };

  const logout = () => {
    debugLog("auth:logout", { role: state.role });
    setState((s) => ({ ...s, role: null, profile: {}, isLoggedIn: false, authReady: true }));
    localStorage.removeItem(STORAGE_KEY);
    clearAuthToken();
  };

  const addDonation: UserContextType["addDonation"] = (d) => {
    debugLog("donations:add_local", { donorType: d.donorType, donorName: d.donorName, category: d.category });
    setState((s) => ({
      ...s,
      donations: [
        {
          ...d,
          id: `d${Date.now()}`,
          createdAt: new Date().toISOString(),
          status: "pending",
        },
        ...s.donations,
      ],
    }));
  };

  const updateDonation: UserContextType["updateDonation"] = (id, patch) => {
    debugLog("donations:update_local", { id, patch });
    setState((s) => ({
      ...s,
      donations: s.donations.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    }));
  };

  return (
    <UserContext.Provider value={{ ...state, login, logout, addDonation, updateDonation }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be inside UserProvider");
  return ctx;
}
