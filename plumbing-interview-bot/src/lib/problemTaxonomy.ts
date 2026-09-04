// Fixed taxonomy of administrative problem areas. Seeds the `problems` table
// and is the closed set the AI must classify into during tagging — it must
// never invent a category outside this list.

export const PROBLEM_TAXONOMY = [
  { key: "enquiry_qualification", label: "Qualifying new enquiries" },
  { key: "info_collection", label: "Collecting customer information" },
  { key: "quoting", label: "Preparing quotes" },
  { key: "chasing_quotes", label: "Chasing unanswered quotes" },
  { key: "scheduling", label: "Scheduling and dispatch" },
  { key: "customer_updates", label: "Customer updates" },
  { key: "invoicing", label: "Invoicing and payment chasing" },
  { key: "job_records", label: "Job records and paperwork" },
  { key: "stock_materials", label: "Materials and stock" },
  { key: "staff_management", label: "Managing employees or subcontractors" },
  { key: "other", label: "Something else" },
] as const;

export type ProblemKey = (typeof PROBLEM_TAXONOMY)[number]["key"];

export const PROBLEM_KEYS: ProblemKey[] = PROBLEM_TAXONOMY.map((p) => p.key);

export function isProblemKey(value: string): value is ProblemKey {
  return (PROBLEM_KEYS as string[]).includes(value);
}
