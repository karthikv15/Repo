import { useState } from "react";
import { api } from "@/lib/api";
import { OUTCOMES, type OutcomeKey, outcomeKeyFromLabel, outcomeLabel } from "@/data/outcomes";
import type { CloseCheckResponse } from "@/types";

interface Props {
  callId: string;
  onClosed: () => void;
}

type CheckState = "idle" | "checking" | "done" | "failed";

export default function EndCallPanel({ callId, onClosed }: Props) {
  const [outcome, setOutcome] = useState<OutcomeKey | null>(null);
  const [summary, setSummary] = useState("");
  const [checkState, setCheckState] = useState<CheckState>("idle");
  const [check, setCheck] = useState<CloseCheckResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  async function runCheck() {
    if (!outcome) return;
    setCheckState("checking");
    setCheck(null);
    try {
      const res = await api.closeCheck(callId, { outcome });
      setCheck(res);
      setSummary(res.summary ?? "");
      setCheckState("done");
    } catch {
      setCheckState("failed");
    }
  }

  async function saveCall() {
    if (!outcome) {
      setSaveErr("Pick how the call ended first.");
      return;
    }
    setSaving(true);
    setSaveErr(null);
    try {
      await api.closeCall(callId, {
        outcome,
        summary,
      });
      onClosed();
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : "Could not save the call");
      setSaving(false);
    }
  }

  return (
    <div className="bg-card border-t border-line px-4 py-4">
      <p className="text-[18px] font-semibold ink">How did it end?</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {OUTCOMES.map((o) => (
          <button
            key={o.key}
            onClick={() => setOutcome(o.key)}
            className={`tap text-[15px] ${outcome === o.key ? "is-on" : ""}`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <button
        onClick={runCheck}
        disabled={!outcome || checkState === "checking"}
        className="mt-4 w-full bg-card border border-teal text-teal font-semibold text-[17px] rounded-xl py-3.5 min-h-[52px] disabled:opacity-40"
      >
        {checkState === "checking" ? "Checking…" : "Check my outcome"}
      </button>

      {checkState === "failed" && (
        <p className="mt-3 text-amber bg-amber-soft border border-amber rounded-lg px-3 py-2 text-[15px]">
          Couldn't check — you can still save.
        </p>
      )}

      {check?.mismatch && (
        <div className="mt-3 bg-amber-soft border border-amber rounded-lg px-3 py-3">
          <p className="text-amber text-[15px] font-medium leading-snug">
            {check.mismatch_note}
          </p>
          <button
            onClick={() => {
              const key = outcomeKeyFromLabel(
                outcomeLabel(check.suggested_outcome),
              );
              if (key) setOutcome(key);
            }}
            className="mt-2 tap text-[15px] is-on"
            style={{ background: "var(--amber)", borderColor: "var(--amber)" }}
          >
            Use: {outcomeLabel(check.suggested_outcome)}
          </button>
        </div>
      )}

      <label className="block mt-4 ink-soft text-[15px]">Summary</label>
      <textarea
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        rows={3}
        placeholder="One line on how the call went"
        className="mt-1.5 w-full bg-card border border-line rounded-xl px-4 py-3 ink text-[17px] leading-snug resize-none"
      />

      {saveErr && (
        <p className="mt-3 text-red bg-red-soft border border-red rounded-lg px-3 py-2 text-[15px]">
          {saveErr}
        </p>
      )}

      <button
        onClick={saveCall}
        disabled={saving || !outcome}
        className="mt-4 w-full bg-teal text-white font-semibold text-[18px] rounded-xl py-4 min-h-[56px] disabled:opacity-40"
      >
        {saving ? "Saving…" : "Save call"}
      </button>
    </div>
  );
}
