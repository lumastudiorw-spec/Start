// Lightweight heuristics for screening answers where the question itself
// names the expected bands, so a full LLM call would be overkill. Nothing
// here is safety- or consent-critical — a wrong guess just means an admin
// corrects it later in the dashboard.

export type TeamSizeBand = "solo" | "2-5" | "6-20" | "20+";
export type WorkType = "reactive" | "maintenance" | "installations" | "mixed";

export function mapTeamSizeBand(text: string): TeamSizeBand | null {
  const lower = text.toLowerCase();
  if (/\bjust me\b|\bsolo\b|\bon my own\b|\bone[-\s]man\b|\bmyself\b/.test(lower)) return "solo";

  const numbers = lower.match(/\d+/g)?.map(Number) ?? [];
  const max = numbers.length > 0 ? Math.max(...numbers) : null;
  if (max !== null) {
    if (max <= 1) return "solo";
    if (max <= 5) return "2-5";
    if (max <= 20) return "6-20";
    return "20+";
  }

  if (/\bcouple\b|\bfew\b|\bhandful\b/.test(lower)) return "2-5";
  return null;
}

export function mapWorkType(text: string): WorkType | null {
  const lower = text.toLowerCase();
  const hasReactive = /\breactive\b|\brepairs?\b|\bemergency\b|\bcallouts?\b/.test(lower);
  const hasMaintenance = /\bmaintenance\b|\bplanned\b|\bservicing\b/.test(lower);
  const hasInstall = /\binstall/.test(lower);
  const mentionedCount = [hasReactive, hasMaintenance, hasInstall].filter(Boolean).length;

  if (/\bmix\b|\bmixture\b|\ba bit of everything\b|\ball of/.test(lower) || mentionedCount >= 2) return "mixed";
  if (hasInstall) return "installations";
  if (hasMaintenance) return "maintenance";
  if (hasReactive) return "reactive";
  return null;
}

export function parseToolsList(text: string): string[] {
  return text
    .split(/,|\band\b|\/|;/i)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

export function mapContactMethod(text: string): "phone" | "email" | "whatsapp" | null {
  const lower = text.toLowerCase();
  if (/whatsapp/.test(lower)) return "whatsapp";
  if (/email|e-mail/.test(lower)) return "email";
  if (/phone|call|text|mobile|number/.test(lower)) return "phone";
  return null;
}
