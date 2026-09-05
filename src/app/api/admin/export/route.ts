import { NextResponse } from "next/server";
import { EXPORT_COLUMNS, getInterviewsForExport } from "@/lib/db/adminQueries";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const rows = await getInterviewsForExport();
  const csv = toCsv(rows, [...EXPORT_COLUMNS]);

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="interviews-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
