// One-off sanity script for the interview state machine — not part of the
// app, just a fast way to walk every path before wiring up the API layer.
// Run with: node --experimental-strip-types scripts/sanity-check-state-machine.ts

import {
  advance,
  canAskFollowUp,
  createInitialState,
  getCurrentQuestion,
  isTerminal,
  markFollowUpAsked,
  TERMINAL_STEP,
} from "../src/lib/interviewStateMachine";

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exitCode = 1;
  } else {
    console.log(`ok: ${msg}`);
  }
}

// --- Path 1: decline at consent ---
{
  let state = createInitialState();
  state = advance(state); // leave INTRO_1
  state = advance(state); // leave INTRO_2
  assert(state.stepId === "CONSENT_Q", "reaches CONSENT_Q");
  state = advance(state, { consentAnswer: false });
  assert(state.status === "declined" && state.stepId === "DECLINED_EXIT", "declines cleanly");
  assert(isTerminal(state), "declined state is terminal");
}

// --- Path 2: full happy path with 2 top problems, follow-up limit enforced ---
{
  let state = createInitialState();
  const steps: string[] = [state.stepId];
  state = advance(state); // INTRO_1 -> INTRO_2
  state = advance(state); // INTRO_2 -> CONSENT_Q
  assert(state.stepId === "CONSENT_Q", "reaches CONSENT_Q on path 2");
  state = advance(state, { consentAnswer: true }); // CONSENT_Q -> SCR_NAME
  assert(state.stepId === "SCR_NAME", "consent yes moves into screening");

  while (state.stepId !== "ADM_RANK") {
    state = advance(state);
    steps.push(state.stepId);
  }
  assert(state.stepId === "ADM_RANK", "reaches ADM_RANK");

  // simulate max follow-ups on ADM_RANK before moving on
  assert(canAskFollowUp(state), "ADM_RANK allows follow-up");
  state = markFollowUpAsked(state);
  state = markFollowUpAsked(state);
  assert(!canAskFollowUp(state), "follow-up cap enforced at 2");

  state = advance(state, { topProblemKeys: ["quoting", "chasing_quotes"] });
  assert(state.stepId === "ADM_FREQ::quoting", "loop starts on first problem");
  assert(state.followUpCount === 0, "follow-up count resets entering loop");

  const expectedPrefixes = [
    "ADM_FREQ",
    "ADM_TIME",
    "ADM_MONEY",
    "ADM_WORKAROUND",
    "ADM_SOFTWARE",
    "ADM_SATISFACTION",
    "ADM_URGENCY",
  ];
  for (const problem of ["quoting", "chasing_quotes"]) {
    for (const prefix of expectedPrefixes) {
      assert(state.stepId === `${prefix}::${problem}`, `deep dive step ${prefix}::${problem}`);
      const question = getCurrentQuestion(state);
      assert(typeof question.text === "string" && question.text.length > 0, `question text resolves for ${state.stepId}`);
      state = advance(state);
    }
  }
  assert(state.stepId === "CT_INTRO", "loop exits back onto spine at CT_INTRO");

  while (state.stepId !== "CL_CONTACT_CONSENT") {
    state = advance(state);
  }
  state = advance(state, { contactConsentAnswer: false });
  assert(state.stepId === "CL_FINAL", "declining contact skips method/value steps");

  state = advance(state); // CL_FINAL -> CL_SIGNOFF
  assert(state.stepId === "CL_SIGNOFF", "reaches sign-off");
  state = advance(state);
  assert(state.stepId === TERMINAL_STEP && state.status === "completed", "interview completes");
  assert(isTerminal(state), "completed state is terminal");
}

// --- Path 3: zero top problems named — loop is skipped entirely ---
{
  let state = createInitialState();
  while (state.stepId !== "ADM_RANK") {
    state = advance(state, { consentAnswer: true });
  }
  state = advance(state, { topProblemKeys: [] });
  assert(state.stepId === "CT_INTRO", "no problems named -> straight to CT_INTRO");
}

// --- Path 4: accepting contact -> method -> value -> final ---
{
  let state = createInitialState();
  while (state.stepId !== "CL_CONTACT_CONSENT") {
    state = advance(state, { consentAnswer: true, topProblemKeys: [] });
  }
  state = advance(state, { contactConsentAnswer: true });
  assert(state.stepId === "CL_CONTACT_METHOD", "accepting contact moves to method");
  state = advance(state);
  assert(state.stepId === "CL_CONTACT_VALUE", "method moves to value");
  state = advance(state);
  assert(state.stepId === "CL_FINAL", "value moves to final");
}

if (process.exitCode === 1) {
  console.error("\nSome checks failed.");
} else {
  console.log("\nAll state machine sanity checks passed.");
}
