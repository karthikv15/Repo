import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

// Fires the health check once on first load (wake the sleeping server).
// Reports a "slow" flag if any tracked request has been in flight for >3s.
export function useHealth() {
  const [slow, setSlow] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const timer = setTimeout(() => setSlow(true), 3000);
    api
      .health()
      .catch(() => {})
      .finally(() => {
        clearTimeout(timer);
        setSlow(false);
      });
  }, []);

  return slow;
}
