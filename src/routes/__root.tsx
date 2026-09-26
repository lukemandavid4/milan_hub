import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useLayoutEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "../components/ui/sonner";
import { clearSession, getSessionExpiry, hasValidSession } from "../lib/session";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Milan Hub — Inventory & Stock Management" },
      {
        name: "description",
        content:
          "Milan Hub is a cyberpunk-styled inventory and stock management dashboard for tracking products, stock levels and sales.",
      },
      { name: "author", content: "Milan Hub" },
      { property: "og:title", content: "Milan Hub — Inventory & Stock Management" },
      {
        property: "og:description",
        content: "Track stock levels, low-stock alerts and category analytics in real time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var root=document.documentElement;var login=location.pathname==='/login';var t=localStorage.getItem('milanhub-theme');var mobile=matchMedia('(max-width: 767px)').matches;var role=localStorage.getItem('milanhub-user-role');if(login){t='dark';localStorage.setItem('milanhub-theme','dark')}root.dataset.loginDark=login?'true':'false';root.classList.toggle('dark',login||t!=='light');root.dataset.userRole=role&&role.toLowerCase()==='seller'?'Seller':'Admin';root.dataset.sidebarCollapsed=mobile||localStorage.getItem('milanhub-sidebar-collapsed')==='true'?'true':'false'}catch(e){}})()",
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useLayoutEffect(() => {
    const isLogin = pathname === "/login";
    document.documentElement.dataset.loginDark = String(isLogin);
    if (isLogin) {
      window.localStorage.setItem("milanhub-theme", "dark");
      document.documentElement.classList.add("dark");
    }
  }, [pathname]);

  return (
    <QueryClientProvider client={queryClient}>
      <SessionExpiryRedirect />
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  );
}

function SessionExpiryRedirect() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();

  useEffect(() => {
    let timer: number | undefined;
    let redirecting = false;
    const checkSession = () => {
      if (timer !== undefined) window.clearTimeout(timer);
      if (pathname === "/login" || redirecting) return;
      if (!hasValidSession()) {
        redirecting = true;
        clearSession();
        void navigate({ to: "/login", replace: true });
        return;
      }
      timer = window.setTimeout(() => {
        redirecting = true;
        clearSession();
        void navigate({ to: "/login", replace: true });
      }, Math.max(0, getSessionExpiry() - Date.now()));
    };

    checkSession();
    window.addEventListener("milanhub-session-change", checkSession);
    window.addEventListener("focus", checkSession);
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
      window.removeEventListener("milanhub-session-change", checkSession);
      window.removeEventListener("focus", checkSession);
    };
  }, [navigate, pathname]);

  return null;
}
