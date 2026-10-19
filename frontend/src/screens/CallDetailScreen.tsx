import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { CallDetail } from "@/types";
import { STAGES, stageByNumber } from "@/data/stages";
import { outcomeLabel } from "@/data/outcomes";
import { useRouter } from "@/lib/router";

interface Props {
  id: string;
}

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

export default function CallDetailScreen({ id }: Props) {
  const { navigate } = useRouter();
  const [call, setCall] = useState<CallDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .getCall(id)
      .then((c) => alive && setCall(c))
      .catch((e) => alive && setErr(e instanceof Error ? e.message : "Could not load call"));
    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-paper px-4 py-6">
      <div className="mx-auto w-full max-w-[520px]">
        <button
          onClick={() => navigate("/calls")}
          className="text-teal underline min-h-[48px] text-[16px]"
        >
          Back to past calls
        </button>

        {err && (
          <p className="mt-4 text-red bg-red-soft border border-red rounded-lg px-3 py-2 text-[15px]">
            {err}
          </p>
        )}

        {!err && !call && <p className="mt-4 ink-soft">Loading call…</p>}

        {call && (
          <>
            <div className="mt-4 bg-card border border-line rounded-xl p-4">
              <h1 className="text-[22px] font-semibold ink">
                {call.prospect_name}
              </h1>
              <p className="ink-soft text-[16px]">{call.company}</p>
              {call.role && (
                <p className="ink-soft text-[14px]">{call.role}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[14px]">
                <span
                  className={`rounded-full px-3 py-1 border ${
                    OUTCOME_COLORS[call.outcome ?? "not_logged"] ??
                    "bg-soft text-muted border-line"
                  }`}
                >
                  {outcomeLabel(call.outcome)}
                </span>
                <span className="ink-soft">
                  Started {new Date(call.started_at).toLocaleString()}
                </span>
              </div>
              {call.summary && (
                <p className="mt-3 ink text-[16px] leading-snug">{call.summary}</p>
              )}
            </div>

            <div className="mt-5 flex flex-col gap-3">
              {STAGES.map((s) => {
                const rec = call.stages?.find((r) => r.stage === s.n);
                const reached = s.n <= (call.stage_reached ?? call.current_stage ?? 0);
                const empty =
                  !rec ||
                  ((!rec.tap_choices || rec.tap_choices.length === 0) &&
                    (!rec.prospect_words || rec.prospect_words.trim() === ""));
                return (
                  <div
                    key={s.n}
                    className="bg-card border border-line rounded-xl p-4"
                  >
                    <p className="ink-soft text-[13px] uppercase tracking-wide">
                      Stage {s.n} of 8
                    </p>
                    <h2 className="text-[18px] font-semibold ink mt-0.5">
                      {s.name}
                    </h2>

                    {!reached || empty ? (
                      <p className="mt-2 text-muted text-[15px] italic">
                        Not reached
                      </p>
                    ) : (
                      <div className="mt-2">
                        {rec.tap_choices && rec.tap_choices.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {rec.tap_choices.map((t) => (
                              <span
                                key={t}
                                className="bg-teal-soft text-teal border border-teal rounded-full px-3 py-1 text-[14px]"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                        {rec.prospect_words && rec.prospect_words.trim() !== "" && (
                          s.n === 5 ? (
                            <blockquote className="mt-3 border-l-4 border-teal bg-teal-soft pl-3 pr-3 py-2 rounded-r-md ink italic text-[16px] leading-snug">
                              {rec.prospect_words}
                            </blockquote>
                          ) : (
                            <p className="mt-2 ink text-[16px] leading-snug">
                              {rec.prospect_words}
                            </p>
                          )
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
