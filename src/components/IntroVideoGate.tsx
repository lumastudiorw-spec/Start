"use client";

import { useState } from "react";

const VIDEO_SRC = "/video/intro.mp4";

export default function IntroVideoGate({ onDone }: { onDone: () => void }) {
  const [started, setStarted] = useState(false);
  const [videoMissing, setVideoMissing] = useState(false);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-between bg-white px-4 py-6">
      <button type="button" onClick={onDone} className="self-end text-sm text-zinc-400 underline">
        Skip intro
      </button>

      <div className="flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6">
        {videoMissing ? (
          <p className="text-center text-sm text-zinc-400">(Intro video coming soon)</p>
        ) : !started ? (
          <button
            type="button"
            onClick={() => setStarted(true)}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg"
            aria-label="Play intro video"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="ml-1 h-8 w-8">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        ) : (
          <video
            src={VIDEO_SRC}
            controls
            autoPlay
            playsInline
            className="w-full rounded-xl bg-black"
            onEnded={onDone}
            onError={() => setVideoMissing(true)}
          />
        )}
      </div>

      <button type="button" onClick={onDone} className="rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white">
        Continue
      </button>
    </main>
  );
}
