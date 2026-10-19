export interface StageContent {
  n: number;
  name: string;
  purpose: string;
  tip: string;
  says: string[];
  taps: string[];
  placeholder: string;
}

export const STAGES: StageContent[] = [
  {
    n: 1,
    name: "Opening",
    purpose:
      "Reach the right person and say who you are. They decide in ten seconds if this call is worth a minute.",
    tip: 'Say the company slowly: "Meridian Growth Partners, Hyderabad." Many people ask twice.',
    says: [
      '"Calling from where? Meridian?"',
      '"I\'m driving / in a meeting / going into an event. Call me at 1:30."',
      '"I left that company last year."',
    ],
    taps: [
      "Right person on the line",
      "Asked who we are",
      "Reception or assistant",
      "Busy, will call back",
      "Wrong person or number",
      "Left the company",
      "Bad line",
      "Wants Hindi / Marathi / Kannada",
    ],
    placeholder: "Who you reached, anything about the line or language",
  },
  {
    n: 2,
    name: "Purpose",
    purpose:
      "Say in one or two sentences why you called, in words they could repeat to a colleague.",
    tip: 'One sentence they can repeat. "A short report on your company, free, from outside research." Not a label.',
    says: [
      '"What is a growth report? Is it like SEO?"',
      '"Where did you get my number?"',
      '"Why is it free? How do you benefit?"',
    ],
    taps: [
      "Asked what we do",
      "Asked where we got the number",
      "Asked why it is free",
      'Said "so you are consultants?"',
      "Said it is a sales call",
      "Let me go on",
    ],
    placeholder: "Their exact question, if any",
  },
  {
    n: 3,
    name: "Permission",
    purpose:
      "Find out if they will talk now. A clear yes, a clear no or a time to call back are all good. Talking on without one is not.",
    tip: "If they name a time, write it down. A time they pick is worth more than one you propose.",
    says: [
      '"Call me after two / in an hour / tomorrow."',
      '"Send it on WhatsApp first and I\'ll reply."',
      '"Haan, boliye." (then silence)',
    ],
    taps: [
      "Yes, go ahead",
      "Call back at a time they named",
      "Send on WhatsApp first",
      "No",
      "Kept talking, no answer",
    ],
    placeholder: "The time or channel they named, in their words",
  },
  {
    n: 4,
    name: "Their business",
    purpose:
      "Ask about their company and work before you talk about yours. People talk about what they do.",
    tip: "Ask what they make and who buys it. Yes/no questions get yes, and a yes tells you nothing.",
    says: [
      '"We\'re a very small company." / "We\'re the market leader."',
      '"I only handle supply chain, not the company."',
      '"We do job work, there\'s hardly any margin."',
    ],
    taps: [
      "Told us what they make",
      "Told us size or role",
      "Corrected us",
      "Asked us to go first",
      "Said someone else handles it",
    ],
    placeholder: "What they make, who buys it",
  },
  {
    n: 5,
    name: "Their need, in their words",
    purpose:
      "Hear what they are trying to do or struggling with, in their own words. This is the one stage where you write down exactly what was said.",
    tip: 'Write their words, not yours. "Skilled manpower" is a need. "Growth challenges" is not.',
    says: [
      '"The biggest challenge is skilled manpower."',
      '"Everything is fine, we have a robust internal process."',
      '"What can you do for a company like ours?"',
    ],
    taps: [
      "Named a goal",
      "Named a challenge",
      "Said all is fine",
      "Asked what we can do for them",
      "Could not say",
      "Not their area",
    ],
    placeholder: "Exactly what they said",
  },
  {
    n: 6,
    name: "Objection",
    purpose:
      "Hear the reason for a no and understand it. A reason you understand can be answered. One you talked over cannot.",
    tip: 'Ask once: "What do you use today?" Do not argue.',
    says: [
      '"We already have consultants / an agency / an in-house team."',
      '"Not the right person. Speak to the CFO / head office."',
      '"Send it in writing, I\'ll see."',
    ],
    taps: [
      "Already have consultants or agency",
      "In-house team",
      "Not the right person",
      "Decision is at HQ or global",
      "Not interested, no reason",
      "Send in writing",
      "Asked for website or clients first",
      "Too small / not relevant",
    ],
    placeholder: "The reason, in their words",
  },
  {
    n: 7,
    name: "Next step",
    purpose:
      "Agree one concrete thing: a document by WhatsApp or email, a call at a named time, or a meeting. One thing, with a time or a channel.",
    tip: 'Get the channel and a time. A "yes" to a document may only be politeness.',
    says: [
      '"Send it on WhatsApp, same number."',
      '"Call me Tuesday after 2."',
      '"Speak to Mr. Naik, I\'ll text you his number."',
    ],
    taps: [
      "Report on WhatsApp",
      "Report on email",
      "Call at a time THEY named",
      "Meeting with founder",
      "Referral with a number",
      "Referral, no number",
      "Wants website or profile first",
    ],
    placeholder: "Channel, day and time, or the name referred",
  },
  {
    n: 8,
    name: "Close",
    purpose:
      "End clearly and record what happened: the outcome, the next step and their words from stage 5. The next call is built on this record.",
    tip: "Repeat the one next step back to them. Log what was said, not what you hoped for.",
    says: [
      "The line drops or they hang up.",
      "A warm goodbye after a no.",
      '"Thank you, send it across."',
    ],
    taps: [
      "Repeated the next step back",
      "Ended cleanly",
      "Line dropped",
      "Hung up",
      "Warm goodbye after a no",
    ],
    placeholder: "Anything the next call needs to know",
  },
];

export function stageByNumber(n: number): StageContent | undefined {
  return STAGES.find((s) => s.n === n);
}
