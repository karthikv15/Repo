import { RouterProvider, matchRoute, useRouter } from "@/lib/router";
import { useHealth } from "@/lib/useHealth";
import StartScreen from "@/screens/StartScreen";
import LiveCallScreen from "@/screens/LiveCallScreen";
import PastCallsScreen from "@/screens/PastCallsScreen";
import CallDetailScreen from "@/screens/CallDetailScreen";

function SlowBanner() {
  const slow = useHealth();
  if (!slow) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-soft border-b border-amber text-amber text-[14px] text-center py-1.5">
      Waking up server…
    </div>
  );
}

function Routes() {
  const { path } = useRouter();
  const { name, params } = matchRoute(path);

  return (
    <div className="no-animation">
      {name === "start" && <StartScreen />}
      {name === "live" && <LiveCallScreen id={params.id} />}
      {name === "list" && <PastCallsScreen />}
      {name === "detail" && <CallDetailScreen id={params.id} />}
    </div>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <SlowBanner />
      <Routes />
    </RouterProvider>
  );
}
