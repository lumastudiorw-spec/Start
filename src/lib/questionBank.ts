// The fixed, reviewed interview script. Every participant sees the same
// wording for the same step id — this is what keeps interviews comparable.
// The LLM is never allowed to alter this text; it may only add a follow-up
// question chosen from FOLLOW_UP_TEMPLATES (see systemPrompts.ts).

export type StepKind = "statement" | "question" | "consent" | "yesno";

export interface QuestionDef {
  id: string;
  kind: StepKind;
  text: string;
  /** Whether an adaptive follow-up (Job A) may be attempted after this answer. */
  allowFollowUp: boolean;
  /** Whether the participant may skip this without answering. */
  skippable: boolean;
}

function q(
  id: string,
  text: string,
  opts: { kind?: StepKind; allowFollowUp?: boolean; skippable?: boolean } = {},
): QuestionDef {
  return {
    id,
    text,
    kind: opts.kind ?? "question",
    allowFollowUp: opts.allowFollowUp ?? false,
    skippable: opts.skippable ?? true,
  };
}

// --- 0. Intro & consent -----------------------------------------------
// The general "what is this, how long, not a sales call" framing is now
// delivered by the intro video (see IntroVideoGate) instead of text — but
// the confidentiality warning stays as text regardless, since it shouldn't
// depend on someone having watched/heard the video.

export const INTRO_STEPS: QuestionDef[] = [
  q(
    "INTRO_2",
    "One thing first — please don't mention any customers' names, addresses or other private details. General descriptions are perfect.",
    { kind: "statement", skippable: false },
  ),
  q(
    "CONSENT_Q",
    "Alright if I note down your answers so we can learn from them? You can skip any question, and stop whenever you like.",
    { kind: "consent", skippable: false },
  ),
];

export const DECLINED_EXIT = q(
  "DECLINED_EXIT",
  "No problem at all — thanks for considering it. Take care.",
  { kind: "statement", skippable: false },
);

// --- 1. Screening --------------------------------------------------------

export const SCREENING_STEPS: QuestionDef[] = [
  q("SCR_NAME", "What's your first name?", { skippable: false }),
  q("SCR_BUSINESS", "What's your business called? Skip this if you'd rather not say."),
  q("SCR_ROLE", "What's your role there — owner, plumber, office/admin, or something else?"),
  q("SCR_YEARS", "Roughly how many years have you been in plumbing?"),
  q(
    "SCR_TEAMSIZE",
    "How many people work in the business including you — just you, 2–5, 6–20, or more?",
  ),
  q(
    "SCR_WORKTYPE",
    "What's the main type of work — reactive repairs, planned maintenance, installations, or a mix?",
  ),
  q(
    "SCR_TOOLS",
    "What do you currently use for enquiries, quotes and job management — WhatsApp, paper, spreadsheets, specific software, anything?",
  ),
];

// --- 2. Current behaviour --------------------------------------------------

export const CURRENT_BEHAVIOUR_STEPS: QuestionDef[] = [
  q(
    "CB_STORY",
    "Think about the most recent quote you prepared. Talk me through what happened, from the customer first getting in touch to you sending the quote.",
    { allowFollowUp: true, skippable: false },
  ),
  q("CB_CHANNEL", "Where did that enquiry come in — phone, WhatsApp, a website form, referral, somewhere else?", {
    allowFollowUp: true,
  }),
  q("CB_INFO_GIVEN", "What did the customer tell you upfront?", { allowFollowUp: true }),
  q("CB_INFO_MISSING", "What was missing that you had to chase up?", { allowFollowUp: true }),
  q("CB_MEDIA", "Did you ask for, or get sent, any photos, videos or measurements?", {
    allowFollowUp: true,
  }),
  q("CB_SITEVISIT", "Did you need a site visit, or could you price it from what they'd sent?", {
    allowFollowUp: true,
  }),
  q("CB_CALC", "How did you work out the price — labour and materials?", { allowFollowUp: true }),
  q(
    "CB_PRICE_SOURCE",
    "Where do your prices come from — a price list, memory, a supplier's site, something else?",
    { allowFollowUp: true },
  ),
  q("CB_CHECKS", "Did you check the quote over before it went out, and how?", { allowFollowUp: true }),
  q("CB_TIME", "Roughly how long did the whole thing take, start to finish?", { allowFollowUp: true }),
  q(
    "CB_TOOLS_USED",
    "What did you actually put it together with — notes, spreadsheet, software, texts to yourself?",
    { allowFollowUp: true },
  ),
];

/** Fixed menu the follow-up model must choose from — see systemPrompts.ts. */
export const FOLLOW_UP_TEMPLATES = [
  "What happened the last time that came up?",
  "How often does that happen?",
  "How much time did that add?",
  "What was the knock-on effect?",
  "How do you deal with that now?",
  "Got a specific example?",
] as const;

// --- 3. Wider admin problems ------------------------------------------------

export const ADMIN_PROBLEMS_STEPS: QuestionDef[] = [
  q(
    "ADM_LIST",
    "Here's a list of the admin jobs that come with running a plumbing business: chasing new enquiries, collecting customer info, preparing quotes, chasing unanswered quotes, scheduling jobs, keeping customers updated, invoicing and chasing payment, job records and paperwork, materials and stock, and managing staff or subs. Which of these actually give you the most hassle?",
    { allowFollowUp: true, skippable: false },
  ),
  q("ADM_RANK", "Of those, which one or two cost you the most time or money?", {
    allowFollowUp: true,
    skippable: false,
  }),
];

/**
 * Deep-dive template, instantiated once per top-ranked problem (max 3).
 * Runtime step ids look like "ADM_FREQ::quoting".
 */
export const PROBLEM_DEEP_DIVE_TEMPLATE: Omit<QuestionDef, "id">[] = [
  { text: "How often does that come up?", kind: "question", allowFollowUp: true, skippable: true },
  {
    text: "About how much time does it cost you when it does?",
    kind: "question",
    allowFollowUp: true,
    skippable: true,
  },
  {
    text: "Has it ever cost you money directly — a missed job, a wrong price, a late payment?",
    kind: "question",
    allowFollowUp: true,
    skippable: true,
  },
  { text: "How do you deal with it at the moment?", kind: "question", allowFollowUp: true, skippable: true },
  { text: "Do you use any tool or software for that already?", kind: "question", allowFollowUp: true, skippable: true },
  {
    text: "Does that workaround actually solve it, or does it just get you by?",
    kind: "question",
    allowFollowUp: true,
    skippable: true,
  },
  {
    text: "How keen would you be to properly fix that, if you could?",
    kind: "question",
    allowFollowUp: true,
    skippable: true,
  },
];

export const PROBLEM_DEEP_DIVE_STEP_PREFIXES = [
  "ADM_FREQ",
  "ADM_TIME",
  "ADM_MONEY",
  "ADM_WORKAROUND",
  "ADM_SOFTWARE",
  "ADM_SATISFACTION",
  "ADM_URGENCY",
] as const;

export function buildDeepDiveStepId(prefix: string, problemKey: string): string {
  return `${prefix}::${problemKey}`;
}

export const MAX_TOP_PROBLEMS = 3;

// --- 4. Concept testing ------------------------------------------------------

export const CONCEPT_STEPS: QuestionDef[] = [
  q(
    "CT_INTRO",
    "Imagine a tool that could take a customer's messages, photos, measurements and voice notes, organise the job information, flag what's missing, and prepare a draft scope, materials list and quote estimate for you to check and approve.",
    { kind: "statement", skippable: false },
  ),
  q("CT_USEFUL", "What would be useful about something like that?", { allowFollowUp: true }),
  q("CT_USELESS", "What would make it useless, or something you'd just switch off?", {
    allowFollowUp: true,
  }),
  q("CT_TRUST", "Which parts would you trust it to get right on its own?", { allowFollowUp: true }),
  q("CT_CHECK", "Which parts would you always want a person to check?", { allowFollowUp: true }),
  q("CT_MISTAKES", "What kind of mistake would worry you most?", { allowFollowUp: true }),
  q(
    "CT_FIT",
    "Would you want it bolted onto what you already use, or would you rather it replaced your current setup?",
    { allowFollowUp: true },
  ),
  q("CT_BLOCKERS", "What would stop you trying something like this?", { allowFollowUp: true }),
  q("CT_EVIDENCE", "What would you need to see before you trusted it?", { allowFollowUp: true }),
];

// --- 5. Commitment testing ------------------------------------------------

export const COMMITMENT_STEPS: QuestionDef[] = [
  q("CM_CALL", "Up for a 20-minute follow-up call to go into more detail?", { kind: "yesno" }),
  q("CM_SHOWPROCESS", "Willing to show us your current quoting process — screenshots or a screen share?", {
    kind: "yesno",
  }),
  q("CM_PROTOTYPE", "If we built something, keen to try an early version?", { kind: "yesno" }),
  q("CM_ANON", "Would you test it using anonymised real jobs — no customer details?", { kind: "yesno" }),
  q("CM_PILOT", "Would you actually use it on a short trial, if it looked promising?", { kind: "yesno" }),
  q("CM_SPEND", "Roughly what does this problem cost you now — in time, tools or money?"),
  q("CM_PAY", "If it reliably solved this, is that worth paying for? No pressure — just your honest take."),
];

// --- 6. Closing --------------------------------------------------------------

export const CLOSING_STEPS: QuestionDef[] = [
  q("CL_THANKS", "That's everything — really appreciate it, thank you.", {
    kind: "statement",
    skippable: false,
  }),
  q("CL_CONTACT_CONSENT", "OK to get in touch again about this?", { kind: "consent", skippable: false }),
  q("CL_CONTACT_METHOD", "Best way to reach you — phone, email or WhatsApp?"),
  q("CL_CONTACT_VALUE", "And your contact details for that?"),
  q("CL_FINAL", "Anything else you'd want us to know?"),
  q("CL_SIGNOFF", "Thanks again — this genuinely helps us work out what's worth building.", {
    kind: "statement",
    skippable: false,
  }),
];

// --- lookups ---------------------------------------------------------------

export const ALL_FIXED_STEPS: QuestionDef[] = [
  ...INTRO_STEPS,
  DECLINED_EXIT,
  ...SCREENING_STEPS,
  ...CURRENT_BEHAVIOUR_STEPS,
  ...ADMIN_PROBLEMS_STEPS,
  ...CONCEPT_STEPS,
  ...COMMITMENT_STEPS,
  ...CLOSING_STEPS,
];

const STEP_BY_ID = new Map(ALL_FIXED_STEPS.map((step) => [step.id, step]));

export function getFixedStep(id: string): QuestionDef | undefined {
  return STEP_BY_ID.get(id);
}
