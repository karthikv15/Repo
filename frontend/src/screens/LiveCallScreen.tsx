import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { CallDetail, StageRecord } from "@/types";
import { STAGES, stageByNumber } from "@/data/stages";
import { Check } from "lucide-react";
import { useRouter } from "@/lib/router";
import StageView from "@/screens/StageView";
import EndCallPanel from "@/screens/EndCallPanel";

interface Props {
  id: string;
}

export default function LiveCallScreen({ id }: Props) {
  const { navigate } = useRouter();
  const [call, setCall] = useState<CallDetail | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [stages, setStages] = useState<StageRecord[]>([]);
  const [showEnd, setShowEnd] = useState(false);

  useEffect(() => {
    let alive = true;
    api
      .getCall(id)
      .then((c) => {
        if (!alive) return;
        setCall(c);
        setStages(c.stages ?? []);
        setCurrentStage(c.current_stage || 1);
      })
      .catch((e) => {
        if (!alive) return;
        setLoadErr(e instanceof Error ? e.message : "Could not load the call");
      });
    return () => {
      alive = false;
    };
  }, [id]);

  // Running timer from started_at.
  const [elapsed, setElapsed] = useState(0);
  const startedMsRef = useRef<number | null>(null);
  useEffect(() => {
    if (!call?.started_at) return;
    const start = new Date(call.started_at).getTime();
    if (Number.isNaN(start)) return;
    startedMsRef.current = start;
    const tick = () => setElapsed(Math.max(0, Date.now() - start));
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [call?.started_at]);

  const mmss = useMemo(() => {
    const s = Math.floor(elapsed / 1000);
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  }, [elapsed]);

  const stageReached = call?.stage_reached ?? currentStage;

  function onStageChanged(next: number) {
    setCurrentStage(next);
    // Keep local stages list in sync with what we saved.
    setStages((prev) => {
      const without = prev.filter((s) => s.stage !== currentStage);
      return without;
    });
    // Fetch latest from server to reflect any autosave.
    api.getCall(id).then((c) => setStages(c.stages ?? [])).catch(() => {});
  }

  if (loadErr) {
    return (
      <div className="min-h-screen bg-paper px-4 py-8">
        <div className="mx-auto w-full max-w-[520px]">
          <p className="text-red bg-red-soft border border-red rounded-lg px-3 py-3">
            {loadErr}
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 text-teal underline min-h-[48px]"
          >
            Back to start
          </button>
        </div>
      </div>
    );
  }

  if (!call) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <p className="ink-soft">Loading call…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-paper border-b border-line">
        <div className="mx-auto w-full max-w-[520px] px-4 py-2.5 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="ink font-semibold text-[16px] truncate">
              {call.company}
            </p>
            <p className="ink-soft text-[14px] truncate">{call.prospect_name}</p>
          </div>
          <div className="ink font-mono text-[16px] tabular-nums">{mmss}</div>
          <button
            onClick={() => setShowEnd((v) => !v)}
            className="bg-red text-white font-semibold text-[15px] rounded-lg px-4 min-h-[44px]"
          >
            End call
          </button>
        </div>

        {/* Progress dots */}
        <div className="mx-auto w-full max-w-[520px] px-4 pb-2.5">
          <div className="flex items-center gap-1.5">
            {STAGES.map((s) => {
              const isCurrent = s.n === currentStage;
              const isPast = s.n < currentStage;
              return (
                <button
                  key={s.n}
                  onClick={() => setCurrentStage(s.n)}
                  className={`flex-1 h-10 rounded-full flex items-center justify-center text-[13px] font-medium ${
                    isCurrent
                      ? "bg-teal text-white"
                      : isPast
                      ? "bg-teal-soft text-teal border border-teal"
                      : "bg-soft text-muted border border-line"
                  }`}
                  title={s.name}
                  aria-label={`Stage ${s.n}: ${s.name}`}
                >
                  {isPast ? <Check size={16} /> : s.n}
                </button>
              );
            })}
          </div>
          <p className="ink-soft text-[13px] mt-1">
            Tap any dot to skip to that stage
          </p>
        </div>
      </div>

      {showEnd ? (
        <EndCallPanel
          callId={id}
          onClosed={() => navigate("/calls")}
        />
      ) : (
        <StageView
          callId={id}
          currentStage={currentStage}
          stageReached={stageReached}
          stages={stages}
          onStageChanged={onStageChanged}
        />
      )}
    </div>
  );
}


