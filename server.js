import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_SERVICE_KEY, GEMINI_API_KEY } = process.env;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const PORT = process.env.PORT || 3000;

const db = createClient(SUPABASE_URL || "http://localhost", SUPABASE_SERVICE_KEY || "missing", {
  auth: { persistSession: false },
});

const OUTCOMES = [
  "agreed_to_receive_report", "next_step_agreed", "interested", "follow_up", "call_again",
  "not_interested", "do_not_call", "wrong_person", "moved_company", "not_logged",
];
const OUTCOME_MEANING = {
  agreed_to_receive_report: "prospect agreed to receive a document on WhatsApp or email",
  next_step_agreed: "a meeting, a call at a set time, or a report plus follow-up call was agreed",
  interested: "prospect said they were interested, no fixed next step",
  follow_up: "caller is to call again",
  call_again: "to be called again, often because of language or line quality",
  not_interested: "prospect declined",
  do_not_call: "prospect asked not to be called",
  wrong_person: "person reached was not the right person",
  moved_company: "person no longer works at the listed company",
  not_logged: "nothing logged",
};
const STAGE_NAMES = ["", "Opening", "Purpose", "Permission", "Their business",
  "Their need", "Objection", "Next step", "Close"];

const app = express();
const origins = (process.env.CORS_ORIGINS || "*").split(",").map((s) => s.trim());
app.use(cors({ origin: origins.includes("*") ? true : origins }));
app.use(express.json({ limit: "100kb" }));

const wrap = (fn) => (req, res) =>
  Promise.resolve(fn(req, res)).catch((e) => {
    console.error(e);
    res.status(500).json({ error: "server_error", detail: String(e.message || e) });
  });
const isUuid = (s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
const bad = (res, msg, code = 400) => res.status(code).json({ error: msg });
const throwIf = (r) => { if (r.error) throw new Error(r.error.message); return r.data; };

app.get("/", (_req, res) => res.json({ name: "call-guide-backend", health: "/health" }));
app.get("/health", (_req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

// Start a call
app.post("/calls", wrap(async (req, res) => {
  const { prospect_name, company, role } = req.body || {};
  if (!prospect_name?.trim() || !company?.trim()) return bad(res, "prospect_name and company are required");
  const row = throwIf(await db.from("calls")
    .insert({ prospect_name: prospect_name.trim(), company: company.trim(), role: role?.trim() || null })
    .select().single());
  res.status(201).json(row);
}));

// Save (or re-save) one stage
app.put("/calls/:id/stages/:stage", wrap(async (req, res) => {
  const { id } = req.params;
  const stage = Number(req.params.stage);
  if (!isUuid(id)) return bad(res, "bad call id");
  if (!Number.isInteger(stage) || stage < 1 || stage > 8) return bad(res, "stage must be 1 to 8");
  const tap_choices = Array.isArray(req.body?.tap_choices) ? req.body.tap_choices.map(String).slice(0, 20) : [];
  const prospect_words = String(req.body?.prospect_words ?? "").slice(0, 5000);

  const call = throwIf(await db.from("calls").select("id, ended_at, stage_reached").eq("id", id).maybeSingle());
  if (!call) return bad(res, "call not found", 404);

  const saved = throwIf(await db.from("stage_results")
    .upsert({ call_id: id, stage, tap_choices, prospect_words, saved_at: new Date().toISOString() },
            { onConflict: "call_id,stage" })
    .select().single());
  throwIf(await db.from("calls")
    .update({ current_stage: stage, stage_reached: Math.max(call.stage_reached, stage) }).eq("id", id));
  res.json(saved);
}));

async function loadCallWithStages(id) {
  const call = throwIf(await db.from("calls").select("*").eq("id", id).maybeSingle());
  if (!call) return null;
  const stages = throwIf(await db.from("stage_results").select("stage, tap_choices, prospect_words, saved_at")
    .eq("call_id", id).order("stage"));
  return { ...call, stages };
}

async function askGemini(prompt) {
  if (!GEMINI_API_KEY) throw new Error("no GEMINI_API_KEY");
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 7000);
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        signal: ctl.signal,
        headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
        }),
      });
    if (!r.ok) throw new Error(`gemini ${r.status}`);
    const j = await r.json();
    const text = j?.candidates?.[0]?.content?.parts?.[0]?.text;
    return JSON.parse(text);
  } finally { clearTimeout(timer); }
}

// LLM: draft a one-line summary and check the outcome the caller chose against what was recorded
app.post("/calls/:id/close-check", wrap(async (req, res) => {
  const { id } = req.params;
  const outcome = req.body?.outcome;
  if (!isUuid(id)) return bad(res, "bad call id");
  if (!OUTCOMES.includes(outcome)) return bad(res, "unknown outcome");
  const call = await loadCallWithStages(id);
  if (!call) return bad(res, "call not found", 404);

  const record = call.stages.map((s) =>
    `Stage ${s.stage} (${STAGE_NAMES[s.stage]}): taps=[${s.tap_choices.join("; ")}] words="${s.prospect_words}"`).join("\n")
    || "(nothing was recorded)";
  const prompt = `You check a cold-call record. A caller from Meridian Growth Partners phoned ${call.prospect_name} (${call.role || "role unknown"}) at ${call.company}.
What the caller recorded, stage by stage:
${record}

The caller chose the outcome "${outcome}".
Allowed outcomes and their meaning:
${OUTCOMES.map((o) => `- ${o}: ${OUTCOME_MEANING[o]}`).join("\n")}

Rules:
- Use ONLY the record above. Do not invent facts.
- "summary": one plain sentence, max 25 words, what happened and where the call ended.
- "suggested_outcome": the allowed outcome that best fits the record.
- "mismatch": true only if the chosen outcome clearly contradicts the record (e.g. next_step_agreed but no next step was recorded; do_not_call but the prospect agreed to a call). If the record is too thin to judge, mismatch is false.
- "mismatch_note": one short sentence naming the contradiction, or "" if none.
Reply as JSON: {"summary": string, "suggested_outcome": string, "mismatch": boolean, "mismatch_note": string}`;

  const out = await askGemini(prompt).catch((e) => { console.error("llm failed:", e.message); return null; });
  if (!out || typeof out.summary !== "string") return res.status(502).json({ error: "llm_unavailable" });
  const suggested = OUTCOMES.includes(out.suggested_outcome) ? out.suggested_outcome : outcome;
  const mismatch = Boolean(out.mismatch) && suggested !== outcome;
  res.json({
    summary: out.summary.slice(0, 300),
    suggested_outcome: suggested,
    mismatch,
    mismatch_note: mismatch ? String(out.mismatch_note || "").slice(0, 300) : "",
  });
}));

// Close the call. Works without the LLM.
app.post("/calls/:id/close", wrap(async (req, res) => {
  const { id } = req.params;
  const { outcome } = req.body || {};
  const summary = req.body?.summary ? String(req.body.summary).slice(0, 500) : null;
  if (!isUuid(id)) return bad(res, "bad call id");
  if (!OUTCOMES.includes(outcome)) return bad(res, "unknown outcome");
  const row = throwIf(await db.from("calls")
    .update({ outcome, summary, ended_at: new Date().toISOString() }).eq("id", id).select().maybeSingle());
  if (!row) return bad(res, "call not found", 404);
  res.json(row);
}));

// List calls
app.get("/calls", wrap(async (_req, res) => {
  const rows = throwIf(await db.from("calls").select("*").order("started_at", { ascending: false }).limit(200));
  res.json(rows);
}));

// One call with its stages
app.get("/calls/:id", wrap(async (req, res) => {
  if (!isUuid(req.params.id)) return bad(res, "bad call id");
  const call = await loadCallWithStages(req.params.id);
  if (!call) return bad(res, "call not found", 404);
  res.json(call);
}));

app.listen(PORT, () => console.log(`call-guide-backend on ${PORT}`));
