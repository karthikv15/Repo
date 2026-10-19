import { useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "@/lib/router";

export default function StartScreen() {
  const { navigate } = useRouter();
  const [prospectName, setProspectName] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canStart = prospectName.trim() && company.trim() && !busy;

  async function start() {
    if (!canStart) return;
    setBusy(true);
    setErr(null);
    try {
      const call = await api.startCall({
        prospect_name: prospectName.trim(),
        company: company.trim(),
        role: role.trim() || undefined,
      });
      navigate(`/call/${call.id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not start the call");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper px-4 py-6">
      <div className="mx-auto w-full max-w-[520px]">
        <h1 className="text-2xl font-semibold ink mb-1">New call</h1>
        <p className="ink-soft text-[15px] mb-6">
          Meridian Growth Partners &middot; call guide
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            start();
          }}
          className="flex flex-col gap-4"
        >
          <label className="flex flex-col gap-1.5">
            <span className="ink-soft text-[15px]">Prospect name</span>
            <input
              value={prospectName}
              onChange={(e) => setProspectName(e.target.value)}
              className="bg-card border border-line rounded-xl px-4 py-3 ink text-[17px] min-h-[52px]"
              placeholder="e.g. Rajesh Mehta"
              autoFocus
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="ink-soft text-[15px]">Company</span>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="bg-card border border-line rounded-xl px-4 py-3 ink text-[17px] min-h-[52px]"
              placeholder="e.g. Acme Industries"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="ink-soft text-[15px]">Role (optional)</span>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="bg-card border border-line rounded-xl px-4 py-3 ink text-[17px] min-h-[52px]"
              placeholder="e.g. Director"
            />
          </label>

          {err && (
            <p className="text-red bg-red-soft border border-red rounded-lg px-3 py-2 text-[15px]">
              {err}
            </p>
          )}

          <button
            type="submit"
            disabled={!canStart}
            className="bg-teal text-white font-semibold text-[18px] rounded-xl py-4 min-h-[56px] disabled:opacity-40 mt-1"
          >
            {busy ? "Starting…" : "Start call"}
          </button>
        </form>

        <button
          onClick={() => navigate("/calls")}
          className="mt-6 text-teal text-[16px] underline underline-offset-4 min-h-[48px] px-2"
        >
          Past calls
        </button>
      </div>
    </div>
  );
}
