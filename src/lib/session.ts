import { useSyncExternalStore } from "react";
import { redirect } from "@tanstack/react-router";

export type UserRole = "Admin" | "Seller";
export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
const SESSION_EXPIRY_KEY = "milanhub-session-expires-at";

export function hasValidSession() {
  if (typeof window === "undefined") return true;
  const email = window.localStorage.getItem("milanhub-user-email");
  const role = window.localStorage.getItem("milanhub-user-role");
  const expiry = Number(window.localStorage.getItem(SESSION_EXPIRY_KEY));
  return Boolean(email && role && Number.isFinite(expiry) && expiry > Date.now());
}

export function getSessionExpiry() {
  if (typeof window === "undefined") return Number.POSITIVE_INFINITY;
  return Number(window.localStorage.getItem(SESSION_EXPIRY_KEY));
}

export function createSession(email: string, role: string) {
  window.localStorage.setItem("milanhub-user-email", email);
  window.localStorage.setItem("milanhub-user-role", role);
  window.localStorage.setItem(SESSION_EXPIRY_KEY, String(Date.now() + SESSION_DURATION_MS));
  document.documentElement.dataset.userRole = role;
  notifySessionChange();
}

export function clearSession() {
  window.localStorage.removeItem("milanhub-user-email");
  window.localStorage.removeItem("milanhub-user-role");
  window.localStorage.removeItem(SESSION_EXPIRY_KEY);
  document.documentElement.dataset.userRole = "Admin";
  notifySessionChange();
}

export function requireSession() {
  if (typeof window !== "undefined" && !hasValidSession()) {
    clearSession();
    throw redirect({ to: "/login" });
  }
}

function readRole(): UserRole {
  if (!hasValidSession() || typeof window === "undefined") return "Admin";
  return window.localStorage.getItem("milanhub-user-role")?.toLowerCase() === "seller"
    ? "Seller"
    : "Admin";
}

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener("milanhub-session-change", listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener("milanhub-session-change", listener);
  };
}

export function useCurrentRole() {
  return useSyncExternalStore(subscribe, readRole, () => "Admin");
}

export function notifySessionChange() {
  window.dispatchEvent(new Event("milanhub-session-change"));
}