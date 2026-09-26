import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Box,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Store,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import loginBackground from "@/assets/login-tech-bg.jpg";
import { apiRequestResult } from "@/lib/api";
import { notifySessionChange } from "@/lib/session";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign In — Milan Hub" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<"Admin" | "Seller">("Admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [requestingAccess, setRequestingAccess] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSigningIn(true);
    if (requestingAccess) {
      const result = await apiRequestResult("/auth/request-access", {
        method: "POST",
        body: JSON.stringify({ email, password, confirmPassword, role }),
      });
      setIsSigningIn(false);
      if (result.ok) {
        toast.success("Access request submitted for admin approval");
        setRequestingAccess(false);
        setPassword("");
        setConfirmPassword("");
      } else {
        toast.error(result.error || "Access request failed");
      }
    } else {
      const result = await apiRequestResult<{ user: { email: string; role: string } }>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
        },
      );
      setIsSigningIn(false);
      if (result.ok && result.data?.user) {
        window.localStorage.setItem("milanhub-user-email", result.data.user.email);
        window.localStorage.setItem("milanhub-user-role", result.data.user.role);
        document.documentElement.dataset.userRole = result.data.user.role;
        notifySessionChange();
        toast.success("Signed in successfully");
        navigate({ to: "/" });
      } else {
        toast.error(result.error || "Only approved accounts can sign in");
      }
    }
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-4 py-8">
      <img
        src={loginBackground}
        alt=""
        className="absolute inset-0 size-full object-cover opacity-85"
      />
      <div className="absolute inset-0 bg-background/35" />
      <section className="panel relative z-10 w-full max-w-[448px] p-8 shadow-2xl">
        <div className="text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-xl bg-primary/12 text-primary glow-ring">
            <Box className="size-7" />
          </span>
          <h1 className="mt-4 text-2xl font-bold">Milan Hub</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {requestingAccess ? "Request access to the system" : "Sign in to continue"}
          </p>
        </div>

        <div className="mt-7">
          <p className="mb-2 text-sm text-muted-foreground">Continue as</p>
          <div className="grid grid-cols-2 gap-3">
            {(["Admin", "Seller"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setRole(item)}
                className={`flex h-[70px] flex-col items-center justify-center gap-1 rounded-xl border text-sm font-medium transition-colors ${role === item ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface-2 text-muted-foreground"}`}
              >
                {item === "Admin" ? (
                  <ShieldCheck className="size-4" />
                ) : (
                  <Store className="size-4" />
                )}
                {item}
              </button>
            ))}
          </div>
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm text-muted-foreground">
            Email
            <div className="mt-1 flex items-center gap-2 rounded-xl border border-input bg-surface-2 px-3">
              <Mail className="size-4 text-muted-foreground" />
              <input
                required
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                placeholder="Enter your email"
                className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </label>
          <label className="block text-sm text-muted-foreground">
            Password
            <div className="mt-1 flex items-center gap-2 rounded-xl border border-input bg-surface-2 px-3">
              <LockKeyhole className="size-4 text-muted-foreground" />
              <input
                required
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={requestingAccess ? "new-password" : "current-password"}
                placeholder={requestingAccess ? "Create a password" : "Enter your password"}
                className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((value) => !value)}
                className="text-muted-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </label>
          {requestingAccess && (
            <label className="block text-sm text-muted-foreground">
              Confirm Password
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-input bg-surface-2 px-3">
                <LockKeyhole className="size-4 text-muted-foreground" />
                <input
                  required
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm your password"
                  className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
            </label>
          )}
          <button
            type="submit"
            disabled={isSigningIn}
            className="mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-glow disabled:cursor-not-allowed disabled:opacity-80"
          >
            {isSigningIn && <LoaderCircle className="size-4 animate-spin" />}
            {requestingAccess ? "Request Access" : `Sign In as ${role}`}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          {requestingAccess ? "Already have an account? " : "New here? "}
          <button
            type="button"
            onClick={() => {
              setRequestingAccess((value) => !value);
              setIsSigningIn(false);
            }}
            className="font-medium text-primary"
          >
            {requestingAccess ? "Back to sign in" : "Request access"}
          </button>
        </p>
      </section>
    </main>
  );
}
