import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { StageRecord } from "@/types";
import { STAGES, stageByNumber } from "@/data/stages";
import { Check } from "lucide-react";

interface Props {
  callId: string;
  currentStage: number;
  stageReached: number;
  stages: StageRecord[];
  onStageChanged: (stage: number) => void;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export default function StageView({
  callId,
  currentStage,
  stageReached,
  stages,
  onStageChanged,
}: Props) {
  const stage = stageByNumber(currentStage)!;
  const existing = stages.find((s) => s.stage === currentStage);

  const [selected, setSelected] = useState<string[]>(existing?.tap_choices ?? []);
  const [words, setWords] = useState<string>(existing?.prospect_words ?? "");
  const [saveState, setSaveState] = useState<SaveState>("idle");

  // Reset local state whenever the stage changes.
  useEffect(() => {
    const rec = stages.find((s) => s.stage === currentStage);
    setSelected(rec?.tap_choices ?? []);
    setWords(rec?.prospect_words ?? "");
    setSaveState("idle");
  }, [currentStage, stages]);

  async function save(next: number) {
    setSaveState("saving");
    try {
      await api.saveStage(callId, currentStage, {
        tap_choices: selected,
        prospect_words: words,
      });
      setSaveState("saved");
      onStageChanged(next);
    } catch {
      setSaveState("error");
    }
  }

  // Autosave 1.5s after typing stops.
  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (saveState === "error") return;
    if (autosaveRef.current) clearTimeout(autosaveRef.current);
    autosaveRef.current = setTimeout(async () => {
      try {
        await api.saveStage(callId, currentStage, {
          tap_choices: selected,
          prospect_words: words,
        });
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 1200);
      } catch {
        setSaveState("error");
      }
    }, 1500);
    return () => {
      if (autosaveRef.current) clearTimeout(autosaveRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words, selected, currentStage, callId]);

  function toggleTap(t: string) {
    setSelected((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  const isStage5 = currentStage === 5;
  const nextStage = STAGES.find((s) => s.n === currentStage + 1);
  const isLast = currentStage === 8;

  return (
    <div className="px-4 pt-4 pb-32">
      {/* 1. Stage header */}
      <p className="ink-soft text-[14px] uppercase tracking-wide">
        Stage {currentStage} of 8
      </p>
      <h2 className="text-[26px] font-semibold ink mt-1 leading-tight">{stage.name}</h2>
      <p className="ink-soft text-[16px] mt-2 leading-snug">{stage.purpose}</p>

      {/* 2. Tip */}
      <p className="mt-4 bg-teal-soft text-teal rounded-lg px-3 py-2 text-[15px] leading-snug">
        Say it like this: {stage.tip}
      </p>

      {/* 3. They may say */}
      <p className="mt-6 ink-soft text-[14px] uppercase tracking-wide">They may say</p>
      <div className="mt-2 flex flex-col gap-2">
        {stage.says.map((s, i) => (
          <div
            key={i}
            className="bg-soft border border-line rounded-lg px-3 py-2.5 italic text-muted text-[15px] leading-snug"
          >
            {s}
          </div>
        ))}
      </div>

      {/* 4. What happened */}
      <p className="mt-6 ink-soft text-[14px] uppercase tracking-wide">What happened</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {stage.taps.map((t) => (
          <button
            key={t}
            onClick={() => toggleTap(t)}
            className={`tap text-[15px] ${selected.includes(t) ? "is-on" : ""}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 5. Their words */}
      <div className="mt-6">
        <label
          className={`block mb-2 text-[15px] ${
            isStage5 ? "ink font-semibold" : "ink-soft"
          }`}
        >
          {isStage5 ? "Write exactly what they said" : "Their words"}
        </label>
        <textarea
          value={words}
          onChange={(e) => setWords(e.target.value)}
          rows={isStage5 ? 6 : 2}
          placeholder={stage.placeholder}
          className="w-full bg-card border border-line rounded-xl px-4 py-3 ink text-[17px] leading-snug resize-none"
        />
      </div>

      {/* Save state */}
      <div className="mt-3 min-h-[24px] flex items-center text-[14px]">
        {saveState === "saving" && <span className="ink-soft">Saving…</span>}
        {saveState === "saved" && (
          <span className="text-teal flex items-center gap-1.5">
            <Check size={16} /> Saved
          </span>
        )}
        {saveState === "error" && (
          <button
            onClick={() => save(currentStage)}
            className="text-red font-medium"
          >
            Not saved — tap to retry
          </button>
        )}
      </div>

      {/* 6. Next button */}
      <div className="fixed bottom-0 left-0 right-0 bg-paper border-t border-line">
        <div className="mx-auto w-full max-w-[520px] px-4 py-3">
          <button
            onClick={() => save(isLast ? currentStage : nextStage!.n)}
            className="w-full bg-teal text-white font-semibold text-[18px] rounded-xl py-4 min-h-[56px]"
          >
            {isLast ? "Save and finish" : `Next: ${nextStage!.name}`}
          </button>
        </div>
      </div>
    </div>
  );
}
