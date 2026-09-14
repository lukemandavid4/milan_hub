export type UserRole = "admin" | "seller";

export type UserStatus = "pending" | "approved" | "rejected";

type StoredUser = {
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  requestedAt: string;
};

const USERS_KEY = "milanhub-users-v1";
const SESSION_KEY = "milanhub-session-v1";
const AUTH_CHANGED_EVENT = "milanhub-auth-changed";

function normalizeUser(
  user: Omit<StoredUser, "status" | "requestedAt"> &
    Partial<Pick<StoredUser, "status" | "requestedAt">>,
): StoredUser {
  return {
    ...user,
    status: user.status ?? "approved",
    requestedAt: user.requestedAt ?? new Date(0).toISOString(),
  };
}

function readUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]).map(normalizeUser) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function subscribeToAuthChanges(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;

  const notify = () => listener();
  window.addEventListener(AUTH_CHANGED_EVENT, notify);
  window.addEventListener("storage", notify);
  return () => {
    window.removeEventListener(AUTH_CHANGED_EVENT, notify);
    window.removeEventListener("storage", notify);
  };
}

export function getPendingUsers() {
  return readUsers().filter((user) => user.status === "pending");
}

export function registerUser(email: string, password: string, role: UserRole) {
  const normalizedEmail = email.trim().toLowerCase();
  const users = readUsers();

  if (users.some((user) => user.email === normalizedEmail)) {
    return { ok: false as const, error: "An account with this email already exists." };
  }

  writeUsers([
    ...users,
    {
      email: normalizedEmail,
      password,
      role,
      status: "pending",
      requestedAt: new Date().toISOString(),
    },
  ]);
  return { ok: true as const };
}

export function authenticateUser(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = readUsers().find(
    (candidate) => candidate.email === normalizedEmail && candidate.password === password,
  );

  if (!user) return { ok: false as const, error: "That email or password is incorrect." };
  if (user.status === "pending") {
    return { ok: false as const, error: "Your access request is awaiting admin approval." };
  }
  if (user.status === "rejected") {
    return { ok: false as const, error: "Your access request was rejected by an admin." };
  }

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return { ok: true as const, user };
}

export function getCurrentUser(): StoredUser | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch {
    return null;
  }
}

export function clearCurrentUser() {
  if (typeof window !== "undefined") window.localStorage.removeItem(SESSION_KEY);
}

export function updateUserStatus(email: string, status: "approved" | "rejected") {
  if (getCurrentUser()?.role !== "admin") return false;

  const normalizedEmail = email.trim().toLowerCase();
  const users = readUsers();
  const user = users.find((candidate) => candidate.email === normalizedEmail);
  if (!user) return false;

  writeUsers(
    users.map((candidate) =>
      candidate.email === normalizedEmail ? { ...candidate, status } : candidate,
    ),
  );
  return true;
}
