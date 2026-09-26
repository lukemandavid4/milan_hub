import { useSyncExternalStore } from "react";

export type UserRole = "Admin" | "Seller";

function readRole(): UserRole {
  if (typeof window === "undefined") return "Admin";
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