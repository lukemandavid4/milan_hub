import { createFileRoute } from "@tanstack/react-router";
import { Box, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Store } from "lucide-react";
import { useState, type FormEvent } from "react";
import loginBackground from "@/assets/login-tech-bg.jpg";
import { authenticateUser, registerUser, type UserRole } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const [mode, setMode] = useState<"signin" | "request">("signin");
  const [role, setRole] = useState<UserRole>("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isRequest = mode === "request";

  function switchMode(nextMode: "signin" | "request") {
    setMode(nextMode);
    setError("");
    setMessage("");
    setPassword("");
    setConfirmPassword("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (isRequest && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (isRequest) {
      const result = registerUser(email, password, role);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      switchMode("signin");
      setMessage("Access requested. An admin must approve your account before you can sign in.");
      return;
    }

    const result = authenticateUser(email, password);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    window.location.assign("/");
  }

  return (
    <div className="grid-noise relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${loginBackground})` }}
      />
      <div className="pointer-events-none absolute inset-0 bg-black/45" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,color-mix(in_oklab,var(--primary)_12%,transparent)_35.2%,transparent_35.5%),linear-gradient(25deg,transparent_65%,color-mix(in_oklab,var(--primary)_9%,transparent)_65.2%,transparent_65.5%)] bg-size-[520px_360px] opacity-40" />
      <div className="relative w-full max-w-md">
        <div className="panel w-full p-8 backdrop-blur-xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-primary/12 text-primary shadow-glow">
              <Box className="size-7" />
            </div>
            <h1 className="text-2xl font-bold">Milan Hub</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isRequest ? "Request access to the system" : "Sign in to continue"}
            </p>
          </div>

          {message && (
            <p className="mb-4 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-center text-sm text-primary">
              {message}
            </p>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <fieldset>
              <legend className="mb-2 text-sm text-muted-foreground">Continue as</legend>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    value: "admin" as const,
                    label: "Admin",
                    detail: "Full access",
                    icon: ShieldCheck,
                  },
                  {
                    value: "seller" as const,
                    label: "Seller",
                    detail: "Record sales",
                    icon: Store,
                  },
                ].map(({ value, label, detail, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRole(value)}
                    aria-pressed={role === value}
                    className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-3 text-sm transition-colors ${role === value ? "border-primary bg-primary/12 text-primary" : "border-border bg-surface-2 text-muted-foreground hover:border-primary/50"}`}
                  >
                    <Icon className="size-4" />
                    <span className="font-semibold">{label}</span>
                    <span className="text-[11px] opacity-70">{detail}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="block text-sm">
              <span className="mb-2 block text-muted-foreground">Email</span>
              <span className="relative block">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email"
                  className="w-full rounded-xl border border-border bg-surface-2 py-2.5 pl-10 pr-3 text-foreground outline-none ring-0"
                />
              </span>
            </label>
            <label className="block text-sm">
              <span className="mb-2 block text-muted-foreground">Password</span>
              <span className="relative block">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  required
                  minLength={6}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={isRequest ? "Create a password" : "Enter your password"}
                  className="w-full rounded-xl border border-border bg-surface-2 py-2.5 pl-10 pr-10 text-foreground outline-none ring-0"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </span>
            </label>
            {isRequest && (
              <label className="block text-sm">
                <span className="mb-2 block text-muted-foreground">Confirm Password</span>
                <input
                  required
                  minLength={6}
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm your password"
                  className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-foreground outline-none ring-0"
                  aria-invalid={Boolean(error && password !== confirmPassword)}
                />
              </label>
            )}
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              className="w-full rounded-xl bg-primary px-4 py-2.5 font-semibold text-primary-foreground shadow-glow"
            >
              {isRequest ? "Request Access" : `Sign In as ${role === "admin" ? "Admin" : "Seller"}`}
            </button>
            <p className="text-center text-xs text-muted-foreground">
              {isRequest ? "Already have an account?" : "New here?"}{" "}
              <button
                type="button"
                onClick={() => switchMode(isRequest ? "signin" : "request")}
                className="font-semibold text-primary hover:underline"
              >
                {isRequest ? "Back to sign in" : "Request access"}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
