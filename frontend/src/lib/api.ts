import type { CallDetail, CallSummary, CloseCheckResponse } from "@/types";

const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "");

if (!BASE) {
  // Surface a clear error during dev if the env var is missing.
  console.warn("VITE_API_URL is not set. API calls will fail.");
}

function url(path: string): string {
  if (!BASE) throw new Error("VITE_API_URL is not set");
  return `${BASE}${path}`;
}

async function req<T>(path: string, init?: RequestInit, timeoutMs?: number): Promise<T> {
  const controller = new AbortController();
  const timer =
    timeoutMs != null
      ? setTimeout(() => controller.abort(), timeoutMs)
      : undefined;
  try {
    const res = await fetch(url(path), {
      ...init,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export const api = {
  health: () => req<void>("/health", { method: "GET" }),

  startCall: (body: { prospect_name: string; company: string; role?: string }) =>
    req<CallSummary>("/calls", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getCall: (id: string) => req<CallDetail>(`/calls/${id}`, { method: "GET" }),

  listCalls: () => req<CallSummary[]>("/calls", { method: "GET" }),

  saveStage: (
    id: string,
    stage: number,
    body: { tap_choices: string[]; prospect_words: string },
  ) =>
    req<void>(`/calls/${id}/stages/${stage}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  closeCheck: (id: string, body: { outcome: string }) =>
    req<CloseCheckResponse>(`/calls/${id}/close-check`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  closeCall: (id: string, body: { outcome: string; summary: string }) =>
    req<void>(`/calls/${id}/close`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
