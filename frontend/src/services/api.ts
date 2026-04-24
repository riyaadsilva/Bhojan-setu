import type { NGO } from "../data/ngos";
import { debugError, debugLog } from "./debug";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || "http://localhost:5000/api";

const TOKEN_KEY = "bhojansetu_token";

export interface ApiUser {
  id: string;
  role: "individual" | "restaurant" | "ngo";
  email: string;
  profile: Record<string, string>;
  status?: string;
}

interface NGOQuery {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  category?: string;
  quantityKg?: number;
  sort?: "nearest" | "rating";
  search?: string;
}

interface DonationQuery {
  status?: string;
  donorType?: string;
  category?: string;
}

interface FoodLogPayload {
  food_name: string;
  food_prepared: number;
  food_consumed: number;
  food_leftover: number;
  preparedQuantity?: number;
  consumedQuantity?: number;
  donatedQuantity?: number;
  wastedQuantity?: number;
  foodCategory?: string;
  logDate?: string;
  donorType?: "individual" | "restaurant";
  unit?: string;
  notes?: string;
}

interface ContactRequestPayload {
  ngo: string;
  donation?: string;
  donorName?: string;
  donorPhone?: string;
  donorEmail?: string;
  donorLocation?: string;
  message: string;
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function previewBody(body?: BodyInit | null) {
  if (!body) return undefined;
  if (body instanceof FormData) return "[FormData]";
  if (typeof body !== "string") return "[body]";
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

export function hasAuthToken() {
  return Boolean(getToken());
}

export function saveAuthToken(token?: string) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  const startedAt = performance.now();
  const method = options.method || "GET";

  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  debugLog("api:start", { method, path, baseUrl: API_BASE_URL, hasToken: Boolean(token), body: previewBody(options.body) });
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch (error) {
    const durationMs = Math.round(performance.now() - startedAt);
    debugError("api:network_error", {
      method,
      path,
      baseUrl: API_BASE_URL,
      durationMs,
      message: error instanceof Error ? error.message : String(error),
    });
    throw new Error(`Cannot reach backend at ${API_BASE_URL}. Make sure the backend server is running and refresh the page.`);
  }
  const payload = await response.json().catch(() => ({}));
  const durationMs = Math.round(performance.now() - startedAt);

  if (!response.ok) {
    debugError("api:error", { method, path, status: response.status, durationMs, payload });
    throw new Error(payload.message || payload.error || "Request failed.");
  }

  debugLog("api:success", { method, path, status: response.status, durationMs });
  return payload as T;
}

export async function fetchNearbyNGOs(query: NGOQuery = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== null) params.set(key, String(value));
  });

  const payload = await apiFetch<{ data: NGO[] }>(`/ngos?${params.toString()}`);
  return payload.data as NGO[];
}

export async function createDonationPost(body: Record<string, unknown>) {
  return apiFetch("/donations", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function fetchDonations(query: DonationQuery = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== null) params.set(key, String(value));
  });

  const payload = await apiFetch<{ data: any[] }>(`/donations${params.toString() ? `?${params.toString()}` : ""}`);
  return payload.data;
}

export async function fetchMyDonations() {
  const payload = await apiFetch<{ data: any[] }>("/donations/mine");
  return payload.data;
}

export async function createContactRequest(payload: ContactRequestPayload) {
  const response = await apiFetch<{ data: any }>("/contact-requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function acceptDonationRequestApi(id: string) {
  const payload = await apiFetch<{ data: any }>(`/donations/${id}/accept`, {
    method: "POST",
  });
  return payload.data;
}

export async function denyDonationRequestApi(id: string) {
  const payload = await apiFetch<{ data: any }>(`/donations/${id}/deny`, {
    method: "POST",
  });
  return payload.data;
}

export async function setDonationFulfillmentApi(id: string, fulfillmentType: "pickup" | "delivery") {
  const payload = await apiFetch<{ data: any }>(`/donations/${id}/fulfillment`, {
    method: "PATCH",
    body: JSON.stringify({ fulfillmentType }),
  });
  return payload.data;
}

export async function completeDonationApi(id: string, body: { completionNote?: string; deliveryProofImage?: string } = {}) {
  const payload = await apiFetch<{ data: any }>(`/donations/${id}/complete`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return payload.data;
}

export async function rateDonationApi(id: string, rating: number) {
  return apiFetch(`/donations/${id}/rating`, {
    method: "PATCH",
    body: JSON.stringify({ rating }),
  });
}

export async function registerUser(body: Record<string, string>) {
  return apiFetch<{ token: string; user: ApiUser }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function loginUser(body: { email: string; password: string; role?: string }) {
  return apiFetch<{ token: string; user: ApiUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function fetchMe() {
  return apiFetch<{ user: ApiUser }>("/auth/me");
}

export async function fetchFoodLogs() {
  const payload = await apiFetch<{ data: any[] }>("/food-logs");
  return payload.data;
}

export async function createFoodLog(payload: FoodLogPayload) {
  const response = await apiFetch<{ data: any }>("/food-logs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function deleteFoodLog(id: string) {
  return apiFetch(`/food-logs/${id}`, { method: "DELETE" });
}

export async function fetchAnalyticsOverview() {
  const payload = await apiFetch<{ data: any }>("/analytics/overview");
  return payload.data;
}

export async function fetchWasteAnalyticsDaily() {
  const payload = await apiFetch<{ data: any }>("/analytics/waste/daily");
  return payload.data;
}

export async function fetchWasteAnalyticsWeekly() {
  const payload = await apiFetch<{ data: any }>("/analytics/waste/weekly");
  return payload.data;
}

export async function fetchWasteAnalyticsMonthly() {
  const payload = await apiFetch<{ data: any }>("/analytics/waste/monthly");
  return payload.data;
}

export async function fetchIndividualWasteAnalytics() {
  const payload = await apiFetch<{ data: any }>("/analytics/waste/individual");
  return payload.data;
}

export async function fetchImpactStories() {
  const payload = await apiFetch<{ data: any[] }>("/impact-stories");
  return payload.data;
}
