"use client";

import { useEffect, useRef, useState } from "react";
import { SCENES } from "./scenes";
import { COLORS } from "./palette";

export default function IntroAnimation({ onDone }: { onDone: () => void }) {
  // Mobile browsers block audio-with-sound from autoplaying without a fresh
  // tap on the page, so playback is gated behind an explicit start screen —
  // the same tap both starts the sequence and (via handleStart) unlocks the
  // <audio> element for the unattended .play() calls that follow it.
  const [started, setStarted] = useState(false);
  const [sceneIndex, setSceneIndex] = useState(0);
  // Only true once the timeout below actually fires for this exact scene —
  // avoids a synchronous setState(false) at the top of the effect (which
  // trips the "no setState directly in an effect body" rule) by deriving
  // "settled" from a comparison instead of resetting it imperatively.
  const [settledIndex, setSettledIndex] = useState(-1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isLast = sceneIndex === SCENES.length - 1;
  const settled = settledIndex === sceneIndex;
  const scene = SCENES[sceneIndex];

  useEffect(() => {
    if (!started) return;
    const settleTimer = setTimeout(() => setSettledIndex(sceneIndex), 50);
    let advanceTimer: ReturnType<typeof setTimeout> | undefined;
    if (!isLast) {
      advanceTimer = setTimeout(() => setSceneIndex((i) => i + 1), SCENES[sceneIndex].durationMs);
    }
    return () => {
      clearTimeout(settleTimer);
      if (advanceTimer) clearTimeout(advanceTimer);
    };
  }, [sceneIndex, isLast, started]);

  useEffect(() => {
    if (!started) return;
    const audio = audioRef.current;
    if (!audio) return;
    if (scene.audioSrc) {
      audio.src = scene.audioSrc;
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } else {
      audio.pause();
      audio.removeAttribute("src");
    }
  }, [sceneIndex, started, scene.audioSrc]);

  function handleStart() {
    setStarted(true);
    const audio = audioRef.current;
    if (audio && scene.audioSrc) {
      audio.src = scene.audioSrc;
      audio.play().catch(() => {});
    }
  }

  function handleDone() {
    audioRef.current?.pause();
    onDone();
  }

  // The <audio> element is hoisted above this branch (rather than duplicated
  // inside each) so the same DOM node persists across the started/!started
  // transition — a fresh element here would drop the .play() call handleStart
  // just made, since React would remount it the instant `started` flips.
  if (!started) {
    return (
      <>
        <audio ref={audioRef} className="hidden" />
        <main
          className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 py-4 text-center"
          style={{ backgroundColor: COLORS.background }}
        >
          <p className="text-sm text-zinc-600">Turn your sound on for a quick introduction.</p>
          <button
            type="button"
            onClick={handleStart}
            className="rounded-full px-6 py-2.5 text-sm font-medium text-white"
            style={{ backgroundColor: COLORS.system }}
          >
            Start
          </button>
          <button type="button" onClick={handleDone} className="text-sm text-zinc-400 underline">
            Skip intro
          </button>
        </main>
      </>
    );
  }

  return (
    <>
      <audio ref={audioRef} className="hidden" />
      <main className="flex min-h-dvh flex-col px-4 py-4" style={{ backgroundColor: COLORS.background }}>
        <div className="mb-3 flex items-center gap-4">
          <div className="flex flex-1 gap-1">
            {SCENES.map((s, i) => (
              <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-black/10">
                <div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: COLORS.outline,
                    width: i < sceneIndex ? "100%" : i === sceneIndex && settled ? "100%" : "0%",
                    transition: i === sceneIndex ? `width ${s.durationMs}ms linear` : "none",
                  }}
                />
              </div>
            ))}
          </div>
          <button type="button" onClick={handleDone} className="shrink-0 text-sm text-zinc-400 underline">
            Skip intro
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="aspect-video w-full max-w-xl overflow-hidden rounded-2xl">{scene.render(settled)}</div>
        </div>

        <p className="mx-auto mt-4 max-w-md text-center text-sm leading-snug text-zinc-700">{scene.caption}</p>

        <div className="mt-4 flex h-[42px] justify-center">
          {isLast && (
            <button
              type="button"
              onClick={handleDone}
              className="rounded-full px-6 py-2.5 text-sm font-medium text-white"
              style={{ backgroundColor: COLORS.system }}
            >
              Start the questions →
            </button>
          )}
        </div>
      </main>
    </>
  );
}
