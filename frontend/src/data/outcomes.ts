export type OutcomeKey =
  | "agreed_to_receive_report"
  | "next_step_agreed"
  | "interested"
  | "follow_up"
  | "call_again"
  | "not_interested"
  | "do_not_call"
  | "wrong_person"
  | "moved_company"
  | "not_logged";

export const OUTCOMES: { key: OutcomeKey; label: string }[] = [
  { key: "agreed_to_receive_report", label: "Agreed to receive report" },
  { key: "next_step_agreed", label: "Next step agreed" },
  { key: "interested", label: "Interested" },
  { key: "follow_up", label: "Follow up" },
  { key: "call_again", label: "Call again" },
  { key: "not_interested", label: "Not interested" },
  { key: "do_not_call", label: "Do not call" },
  { key: "wrong_person", label: "Wrong person" },
  { key: "moved_company", label: "Moved company" },
  { key: "not_logged", label: "Nothing logged" },
];

export function outcomeLabel(key: string | null | undefined): string {
  if (!key) return "Nothing logged";
  return OUTCOMES.find((o) => o.key === key)?.label ?? key;
}

export function outcomeKeyFromLabel(label: string): OutcomeKey | undefined {
  return OUTCOMES.find((o) => o.label === label)?.key;
}
