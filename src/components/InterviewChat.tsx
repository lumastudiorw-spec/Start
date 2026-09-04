"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface ChatMessage {
  role: "bot" | "user";
  content: string;
  questionId: string | null;
}

interface CurrentQuestion {
  id: string;
  kind: "statement" | "question" | "consent" | "yesno";
  skippable: boolean;
}

interface Props {
  token: string;
  status: "in_progress" | "completed" | "declined" | "abandoned";
  currentQuestion: CurrentQuestion | null;
  initialMessages: ChatMessage[];
}

export default function InterviewChat({ token, status: initialStatus, currentQuestion: initialQuestion, initialMessages }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestion | null>(initialQuestion);
  const [status, setStatus] = useState(initialStatus);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isOver = status !== "in_progress";
  const askingYesNo = currentQuestion?.kind === "consent" || currentQuestion?.kind === "yesno";

  async function send(answer: string, skipped: boolean) {
    if (sending || isOver) return;
    setSending(true);
    setError(null);

    if (!skipped) {
      setMessages((prev) => [...prev, { role: "user", content: answer, questionId: currentQuestion?.id ?? null }]);
    }
    setInputValue("");

    try {
      const res = await fetch(`/api/interview/${token}/message`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ answer, skipped }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong — please try again.");
        return;
      }
      setMessages((prev) => [...prev, ...data.messages]);
      setCurrentQuestion(data.currentQuestion);
      setStatus(data.status);
    } catch {
      setError("Couldn't reach the server — check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete everything you've told us so far? This can't be undone.")) return;
    try {
      const res = await fetch(`/api/interview/${token}/delete`, { method: "POST" });
      if (res.ok) setDeleted(true);
      else setError("Couldn't delete right now — please try again.");
    } catch {
      setError("Couldn't reach the server — check your connection and try again.");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    send(trimmed, false);
  }

  if (deleted) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-zinc-50 px-6 text-center">
        <p className="text-sm text-zinc-500">Done — everything you told us has been deleted.</p>
      </main>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-zinc-50">
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto flex max-w-lg flex-col gap-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "bot" ? "justify-start" : "justify-end"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] leading-snug whitespace-pre-wrap ${
                  m.role === "bot" ? "bg-white text-zinc-900 shadow-sm" : "bg-zinc-900 text-white"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-white px-4 py-2.5 text-sm text-zinc-400 shadow-sm">…</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {error && <div className="mx-auto w-full max-w-lg px-4 pb-1 text-sm text-red-600">{error}</div>}

      {!isOver && (
        <div className="border-t border-zinc-200 bg-white px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          <div className="mx-auto max-w-lg">
            {askingYesNo && (
              <div className="mb-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => send("Yes", false)}
                  disabled={sending}
                  className="flex-1 rounded-full bg-zinc-900 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => send("No", false)}
                  disabled={sending}
                  className="flex-1 rounded-full border border-zinc-300 py-2 text-sm font-medium text-zinc-700 disabled:opacity-50"
                >
                  No
                </button>
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                rows={1}
                placeholder="Type your answer…"
                disabled={sending}
                className="max-h-32 flex-1 resize-none rounded-2xl border border-zinc-300 px-4 py-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-zinc-400 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={sending || !inputValue.trim()}
                className="rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40"
              >
                Send
              </button>
            </form>
            {currentQuestion?.skippable && (
              <button
                type="button"
                onClick={() => send("", true)}
                disabled={sending}
                className="mt-2 text-sm text-zinc-400 underline disabled:opacity-50"
              >
                Skip this question
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-center gap-4 border-t border-zinc-200 bg-white py-2 text-xs text-zinc-400">
        <Link href="/privacy" className="underline">
          Privacy
        </Link>
        <button type="button" onClick={handleDelete} className="underline">
          Delete my answers
        </button>
      </div>
    </div>
  );
}
