import type { ReactNode } from "react";
import Image from "next/image";
import { COLORS } from "./palette";
import { Character } from "./Character";
import {
  CalendarIcon,
  ChartBoardIcon,
  CheckBadgeIcon,
  ClockIcon,
  ContactCardIcon,
  DocumentIcon,
  MagnifyingGlassIcon,
  MessageIcon,
  PhoneIcon,
  QuestionCardIcon,
} from "./icons";
import DecisionSplice from "./DecisionSplice";

interface AnimState {
  opacity?: number;
  x?: number;
  y?: number;
  scale?: number;
}

function Anim({
  settled,
  from,
  to,
  delayMs = 0,
  className,
  children,
}: {
  settled: boolean;
  from: AnimState;
  to: AnimState;
  delayMs?: number;
  className?: string;
  children: ReactNode;
}) {
  const s = settled ? to : from;
  const { opacity = 1, x = 0, y = 0, scale = 1 } = s;
  return (
    <div
      className={className}
      style={{
        opacity,
        transform: `translate(${x}px, ${y}px) scale(${scale})`,
        transition: `opacity 1.3s ease-in-out ${delayMs}ms, transform 1.3s ease-in-out ${delayMs}ms`,
      }}
    >
      {children}
    </div>
  );
}

const iconWrap = "flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm";

export interface Scene {
  durationMs: number;
  caption: string;
  render: (settled: boolean) => ReactNode;
}

export const SCENES: Scene[] = [
  // 1 — Introduction
  {
    durationMs: 3000,
    caption: "Hi, this is Marbury Studios.",
    render: (settled) => (
      <div className="flex h-full items-center justify-center">
        <Anim settled={settled} from={{ opacity: 0, scale: 0.9 }} to={{ opacity: 1, scale: 1 }}>
          <Image src="/brand/marbury-logo.png" alt="Marbury Studios" width={280} height={57} priority />
        </Anim>
      </div>
    ),
  },

  // 2 — What the company does
  {
    durationMs: 5000,
    caption: "We're a UK-based company that creates practical solutions to real-world problems.",
    render: (settled) => {
      const icons = [PhoneIcon, DocumentIcon, ClockIcon, MessageIcon, CalendarIcon];
      const scattered = [
        { x: -90, y: -60 },
        { x: 80, y: -40 },
        { x: -60, y: 50 },
        { x: 90, y: 55 },
        { x: 0, y: -90 },
      ];
      return (
        <div className="flex h-full items-center justify-center">
          <div className="flex gap-4">
            {icons.map((Icon, i) => (
              <Anim key={i} settled={settled} from={{ ...scattered[i], opacity: 0.5 }} to={{ x: 0, y: 0, opacity: 1 }} delayMs={i * 80}>
                <div className={iconWrap}>
                  <Icon className="h-8 w-8" />
                </div>
              </Anim>
            ))}
          </div>
        </div>
      );
    },
  },

  // 3 — Current research focus
  {
    durationMs: 7000,
    caption:
      "We look for areas where people are losing time or relying on systems that could be simpler. One area we're researching now is the plumbing industry.",
    render: (settled) => (
      <div className="flex h-full items-center justify-center gap-6">
        <Anim
          settled={settled}
          from={{ opacity: 1, scale: 1 }}
          to={{ opacity: 0, scale: 0.7 }}
          delayMs={2500}
          className="flex flex-col items-center gap-2"
        >
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-sm">
            <ClockIcon className="h-10 w-10" />
          </div>
          <span className="text-xs text-zinc-500">Wasted time</span>
        </Anim>
        <Anim
          settled={settled}
          from={{ opacity: 1, scale: 1.15 }}
          to={{ opacity: 1, scale: 1.5 }}
          delayMs={2500}
          className="flex flex-col items-center gap-2"
        >
          <div className="flex h-28 w-28 items-center justify-center rounded-full shadow-md" style={{ backgroundColor: COLORS.background, border: `3px solid ${COLORS.plumber}` }}>
            <Character role="plumber" className="h-20 w-20" />
          </div>
          <span className="text-xs font-medium text-zinc-700">Plumbing</span>
        </Anim>
        <Anim
          settled={settled}
          from={{ opacity: 1, scale: 1 }}
          to={{ opacity: 0, scale: 0.7 }}
          delayMs={2500}
          className="flex flex-col items-center gap-2"
        >
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-sm">
            <MagnifyingGlassIcon className="h-10 w-10" />
          </div>
          <span className="text-xs text-zinc-500">Confusing workflows</span>
        </Anim>
      </div>
    ),
  },

  // 4 — Administrative burden
  {
    durationMs: 10000,
    caption:
      "Our aim is to take repetitive admin off plumbers' hands — from enquiries and job details to quotes and follow-ups.",
    render: (settled) => {
      const icons = [PhoneIcon, MessageIcon, DocumentIcon, ClockIcon];
      // Kept within +-100x/+-55y so nothing clips the aspect-video frame at
      // phone widths, where the box is much shorter than it is wide. All
      // four corners, deliberately none above center — that's where the
      // character's head is.
      const positions = [
        { x: -100, y: -55 },
        { x: 100, y: -55 },
        { x: -100, y: 55 },
        { x: 100, y: 55 },
      ];
      return (
        <div className="relative flex h-full items-center justify-center">
          <Character role="plumber" leftArmAngle={-15} rightArmAngle={20} className="h-28 w-28" />
          {icons.map((Icon, i) => (
            <Anim
              key={i}
              settled={settled}
              from={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
              to={{ opacity: 1, ...positions[i], scale: 1 }}
              delayMs={300 + i * 150}
              className="absolute"
            >
              <div className={iconWrap}>
                <Icon className="h-7 w-7" />
              </div>
            </Anim>
          ))}
        </div>
      );
    },
  },

  // 5 — The proposed direction
  {
    durationMs: 7000,
    caption: "Less repetitive admin.",
    render: (settled) => (
      <div className="relative flex h-full items-center justify-center gap-10">
        <Character role="plumber" leftArmAngle={-10} className="h-28 w-28" />
        <Anim settled={settled} from={{ opacity: 0, scale: 0.5 }} to={{ opacity: 1, scale: 1 }} delayMs={300}>
          <CheckBadgeIcon className="h-14 w-14" />
        </Anim>
      </div>
    ),
  },

  // 6 — Research before building
  {
    durationMs: 8000,
    caption: "Before building anything, we want to understand how plumbers actually work and what's genuinely worth improving.",
    render: (settled) => (
      <div className="flex h-full items-center justify-center gap-10">
        {[0, 1, 2].map((i) => (
          <Anim key={i} settled={settled} from={{ opacity: 0, y: 30 }} to={{ opacity: 1, y: 0 }} delayMs={i * 200} className="flex flex-col items-center gap-3">
            <QuestionCardIcon className="h-10 w-10" />
            <Character role="plumber" className="h-20 w-20" />
          </Anim>
        ))}
      </div>
    ),
  },

  // 7 — Turning answers into insight
  {
    durationMs: 8000,
    caption: "That's why we're asking you a few short questions.",
    render: (settled) => (
      <div className="relative flex h-full items-center justify-center gap-10">
        {[0, 1, 2].map((i) => (
          <Anim key={i} settled={settled} from={{ opacity: 0, y: 15 }} to={{ opacity: 1, y: 0 }} delayMs={i * 100} className="flex flex-col items-center gap-3">
            <DocumentIcon className="h-10 w-10" />
            <Character role="plumber" className="h-20 w-20" />
          </Anim>
        ))}
        <Anim
          settled={settled}
          from={{ opacity: 0, scale: 0.5 }}
          to={{ opacity: 1, scale: 1 }}
          delayMs={600}
          className="absolute -top-4"
        >
          <div className={iconWrap}>
            <ChartBoardIcon className="h-8 w-8" />
          </div>
        </Anim>
      </div>
    ),
  },

  // 8 — Making decisions
  {
    durationMs: 8000,
    caption: "Your answers directly influence what we build, what we prioritise, and what we leave out.",
    render: (settled) => <DecisionSplice active={settled} />,
  },

  // 9 — Research and privacy
  {
    durationMs: 8000,
    caption: "This is research, not a sales pitch — taking part doesn't commit you to anything, and your answers are analysed without your name attached.",
    render: (settled) => (
      <div className="flex h-full items-center justify-center gap-16">
        <Anim settled={settled} from={{ opacity: 1, x: 30 }} to={{ opacity: 1, x: 0, scale: 1 }} className="flex flex-col items-center gap-2">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl" style={{ border: `3px solid ${COLORS.system}` }}>
            <DocumentIcon className="h-10 w-10" />
          </div>
          <span className="text-xs text-zinc-500">Research</span>
        </Anim>
        <Anim settled={settled} from={{ opacity: 1, x: -30 }} to={{ opacity: 1, x: 0 }} className="flex flex-col items-center gap-2">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl" style={{ border: `3px solid ${COLORS.customer}` }}>
            <ContactCardIcon className="h-10 w-10" />
          </div>
          <span className="text-xs text-zinc-500">Contact (optional)</span>
        </Anim>
      </div>
    ),
  },

  // 10 — Updates and conclusion
  {
    durationMs: 7000,
    caption: "Thank you for helping us build something that genuinely works for plumbers.",
    render: (settled) => (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <Anim settled={settled} from={{ opacity: 0.5, scale: 0.9 }} to={{ opacity: 1, scale: 1 }}>
          <Character role="plumber" rightArmAngle={-25} className="h-32 w-32" />
        </Anim>
        <Anim settled={settled} from={{ opacity: 0 }} to={{ opacity: 1 }} delayMs={400}>
          <span className="text-sm font-semibold tracking-wide text-zinc-700">Help us build it properly</span>
        </Anim>
      </div>
    ),
  },
];
