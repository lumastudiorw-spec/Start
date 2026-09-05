export function toCsv(rows: Record<string, string>[], columns: string[]): string {
  const escape = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
  const header = columns.map(escape).join(",");
  const lines = rows.map((row) => columns.map((c) => escape(row[c] ?? "")).join(","));
  return [header, ...lines].join("\r\n");
}
