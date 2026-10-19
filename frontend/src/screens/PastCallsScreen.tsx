import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { CallSummary } from "@/types";
import { STAGES, stageByNumber } from "@/data/stages";
import { OUTCOMES, outcomeLabel } from "@/data/outcomes";
import { useRouter } from "@/lib/router";

const OUTCOME_COLORS: Record<string, string> = {
  agreed_to_receive_report: "bg-teal-soft text-teal border-teal",
  next_step_agreed: "bg-teal-soft text-teal border-teal",
  interested: "bg-teal-soft text-teal border-teal",
  follow_up: "bg-amber-soft text-amber border-amber",
  call_again: "bg-amber-soft text-amber border-amber",
  not_interested: "bg-soft text-muted border-line",
  do_not_call: "bg-red-soft text-red border-red",
  wrong_person: "bg-soft text-muted border-line",
  moved_company: "bg-soft text-muted border-line",
  not_logged: "bg-soft text-muted border-line",
};

export default function PastCallsScreen() {
  const { navigate } = useRouter();
  const [calls, setCalls] = useState<CallSummary[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    let alive = true;
    api
      .listCalls()
      .then((c) => alive && setCalls(c))
      .catch((e) => alive && setErr(e instanceof Error ? e.message : "Could not load calls"));
    return () => {
      alive = false;
    };
  }, []);

  const sorted = useMemo(
    () =>
      (calls ?? [])
        .slice()
        .sort(
          (a, b) =>
            new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
        ),
    [calls],
  );

  // Stage distribution (calls that ended at each stage).
  const stageCounts = useMemo(() => {
    const counts = new Array(STAGES.length + 1).fill(0); // index by stage number
    for (const c of sorted) counts[c.stage_reached ?? c.current_stage ?? 0]++;
    return counts;
  }, [sorted]);

  const maxCount = Math.max(1, ...stageCounts.slice(1));

  const outcomesInList = useMemo(() => {
    const set = new Set<string>();
    for (const c of sorted) if (c.outcome) set.add(c.outcome);
    return Array.from(set);
  }, [sorted]);

  const filtered = useMemo(() => {
    if (filter === "all") return sorted;
    return sorted.filter((c) => (c.outcome ?? "not_logged") === filter);
  }, [sorted, filter]);

  return (
    <div className="min-h-screen bg-paper px-4 py-6">
      <div className="mx-auto w-full max-w-[520px]">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold ink">Past calls</h1>
          <button
            onClick={() => navigate("/")}
            className="bg-teal text-white font-semibold text-[16px] rounded-xl px-5 min-h-[48px]"
          >
            New call
          </button>
        </div>

        {/* Stage distribution */}
        <section className="mt-6 bg-card border border-line rounded-xl p-4">
          <p className="ink-soft text-[14px] uppercase tracking-wide">
            Where your calls end
          </p>
          <div className="mt-3 flex flex-col gap-1.5">
            {STAGES.map((s) => {
              const count = stageCounts[s.n] ?? 0;
              const pct = Math.round((count / maxCount) * 100);
              return (
                <div key={s.n} className="flex items-center gap-3">
                  <div className="w-[120px] shrink-0 text-[14px] ink-soft truncate">
                    {s.n}. {s.name}
                  </div>
                  <div className="flex-1 h-7 bg-soft rounded-md overflow-hidden border border-line">
                    <div
                      className="h-full bg-teal"
                      style={{ width: `${count === 0 ? 0 : Math.max(pct, 6)}%` }}
                    />
                  </div>
                  <div className="w-7 text-right text-[14px] tabular-nums ink">
                    {count}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Filters */}
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`tap text-[15px] ${filter === "all" ? "is-on" : ""}`}
          >
            All
          </button>
          {outcomesInList.map((o) => (
            <button
              key={o}
              onClick={() => setFilter(o)}
              className={`tap text-[15px] ${filter === o ? "is-on" : ""}`}
            >
              {outcomeLabel(o)}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="mt-4 flex flex-col gap-3">
          {err && (
            <p className="text-red bg-red-soft border border-red rounded-lg px-3 py-2 text-[15px]">
              {err}
            </p>
          )}
          {!err && calls && filtered.length === 0 && (
            <p className="ink-soft text-[15px]">No calls yet.</p>
          )}
          {filtered.map((c) => {
            const reached = c.stage_reached ?? c.current_stage ?? 0;
            const st = stageByNumber(reached);
            const chipClass =
              OUTCOME_COLORS[c.outcome ?? "not_logged"] ??
              "bg-soft text-muted border-line";
            return (
              <button
                key={c.id}
                onClick={() => navigate(`/calls/${c.id}`)}
                className="text-left bg-card border border-line rounded-xl p-4 min-h-[88px]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="ink font-semibold text-[17px] truncate">
                      {c.prospect_name}
                    </p>
                    <p className="ink-soft text-[15px] truncate">{c.company}</p>
                  </div>
                  <span
                    className={`shrink-0 text-[13px] rounded-full px-3 py-1 border ${chipClass}`}
                  >
                    {outcomeLabel(c.outcome)}
                  </span>
                </div>
                <p className="mt-2 ink text-[15px] line-clamp-2">
                  {c.summary || "No summary recorded."}
                </p>
                <div className="mt-2 flex items-center justify-between text-[13px] ink-soft">
                  <span>
                    Stage {reached}
                    {st ? ` · ${st.name}` : ""}
                  </span>
                  <span>{formatTime(c.started_at)}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { day: "2-digit", month: "short" });
}
