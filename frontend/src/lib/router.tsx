import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

type Route = string;

interface RouterCtx {
  path: string;
  navigate: (to: string) => void;
}

const Ctx = createContext<RouterCtx | null>(null);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState<string>(() => window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = useCallback((to: string) => {
    if (to === window.location.pathname) return;
    window.history.pushState({}, "", to);
    setPath(to);
    window.scrollTo(0, 0);
  }, []);

  return <Ctx.Provider value={{ path, navigate }}>{children}</Ctx.Provider>;
}

export function useRouter(): RouterCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRouter must be used inside RouterProvider");
  return ctx;
}

export function matchRoute(path: Route): { name: string; params: Record<string, string> } {
  const segments = path.replace(/^\//, "").split("/").filter(Boolean);
  if (segments.length === 0) return { name: "start", params: {} };
  if (segments[0] === "call" && segments[1])
    return { name: "live", params: { id: segments[1] } };
  if (segments[0] === "calls" && !segments[1])
    return { name: "list", params: {} };
  if (segments[0] === "calls" && segments[1])
    return { name: "detail", params: { id: segments[1] } };
  return { name: "start", params: {} };
}
