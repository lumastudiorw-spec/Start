"use client";

import { useEffect, useState } from "react";
import { COLORS } from "./palette";

type Stage = "stack" | "split" | "merge";

interface GroupStyle {
  x: number;
  y: number;
  opacity: number;
  scale: number;
  labelOpacity: number;
}

const STYLES: Record<"build" | "prioritise" | "leaveOut", Record<Stage, GroupStyle>> = {
  build: {
    stack: { x: 0, y: 0, opacity: 0, scale: 0.8, labelOpacity: 0 },
    split: { x: -90, y: 0, opacity: 1, scale: 1, labelOpacity: 1 },
    merge: { x: 0, y: 0, opacity: 0, scale: 0.55, labelOpacity: 0 },
  },
  prioritise: {
    stack: { x: 0, y: 0, opacity: 0, scale: 0.8, labelOpacity: 0 },
    split: { x: 0, y: 0, opacity: 1, scale: 1, labelOpacity: 1 },
    merge: { x: 0, y: 0, opacity: 0, scale: 0.55, labelOpacity: 0 },
  },
  leaveOut: {
    stack: { x: 0, y: 0, opacity: 0, scale: 0.8, labelOpacity: 0 },
    split: { x: 90, y: 0, opacity: 1, scale: 1, labelOpacity: 1 },
    merge: { x: 150, y: 0, opacity: 0, scale: 0.65, labelOpacity: 0 },
  },
};

const CARD_COLORS = { build: COLORS.system, prioritise: COLORS.plumber, leaveOut: COLORS.inactive };
const LABELS = { build: "BUILD", prioritise: "PRIORITISE", leaveOut: "LEAVE OUT" };

function Card({ group }: { group: "build" | "prioritise" | "leaveOut" }) {
  const color = CARD_COLORS[group];
  return (
    <div className="flex h-20 w-16 flex-col items-center justify-center gap-1.5 rounded-xl bg-white p-2 shadow-sm">
      <div className="h-2.5 w-10 rounded" style={{ backgroundColor: color }} />
      <div className="h-2.5 w-8 rounded" style={{ backgroundColor: color }} />
    </div>
  );
}

function Group({ group, stage }: { group: "build" | "prioritise" | "leaveOut"; stage: Stage }) {
  const s = STYLES[group][stage];
  return (
    <div
      className="absolute flex flex-col items-center gap-2"
      style={{
        opacity: s.opacity,
        transform: `translate(${s.x}px, ${s.y}px) scale(${s.scale})`,
        transition: "opacity 1.1s ease-in-out, transform 1.1s ease-in-out",
      }}
    >
      <Card group={group} />
      <span
        className="text-[10px] font-semibold tracking-wide text-zinc-600"
        style={{ opacity: s.labelOpacity, transition: "opacity 0.6s ease-in-out" }}
      >
        {LABELS[group]}
      </span>
    </div>
  );
}

/** What build + prioritise converge into — the payoff moment, so it lands with a pop, not a plain fade. */
function MergedBlock({ visible }: { visible: boolean }) {
  return (
    <div className="absolute flex flex-col items-center gap-2">
      <div
        className="flex h-20 w-16 flex-col items-center justify-center gap-1.5 rounded-xl bg-white p-2"
        style={
          visible
            ? { animation: "marbury-pop-in 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s both" }
            : { opacity: 0, transform: "scale(0.4)" }
        }
      >
        <div className="h-2.5 w-10 rounded" style={{ backgroundColor: COLORS.plumber }} />
        <div className="h-2.5 w-10 rounded" style={{ backgroundColor: COLORS.system }} />
      </div>
      <span
        className="text-[10px] font-bold tracking-wide text-zinc-700"
        style={{ opacity: visible ? 1 : 0, transition: "opacity 0.7s ease-in-out 1.3s" }}
      >
        FINAL PRODUCT
      </span>
    </div>
  );
}

/** The initial undifferentiated pile of feature cards, before they're sorted. */
function Pile({ visible }: { visible: boolean }) {
  return (
    <div
      className="absolute"
      style={{
        opacity: visible ? 1 : 0,
        transform: `scale(${visible ? 1 : 1.25})`,
        transition: "opacity 0.7s ease-in-out, transform 0.7s ease-in-out",
      }}
    >
      <div className="relative h-20 w-16">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 rounded-xl bg-white p-2 shadow-sm"
            style={{ transform: `translate(${i * 4}px, ${i * 4}px)` }}
          >
            <div className="h-2.5 w-10 rounded bg-zinc-300" />
            <div className="h-2.5 w-8 rounded bg-zinc-300" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DecisionSplice({ active }: { active: boolean }) {
  const [stage, setStage] = useState<Stage>("stack");

  useEffect(() => {
    // This component always mounts fresh with active=false, then active
    // flips to true exactly once (driven by the scene's "settled" prop) —
    // it never toggles back, so there's nothing to reset here.
    if (!active) return;
    const t1 = setTimeout(() => setStage("split"), 900);
    const t2 = setTimeout(() => setStage("merge"), 4200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [active]);

  return (
    <div className="relative flex h-full items-center justify-center">
      <Pile visible={stage === "stack"} />
      <Group group="build" stage={stage} />
      <Group group="prioritise" stage={stage} />
      <Group group="leaveOut" stage={stage} />
      <MergedBlock visible={stage === "merge"} />
    </div>
  );
}
