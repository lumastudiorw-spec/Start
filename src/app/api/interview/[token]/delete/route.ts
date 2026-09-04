import { NextResponse } from "next/server";
import { deleteParticipantByToken } from "@/lib/db/interviews";

export async function POST(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  try {
    const deleted = await deleteParticipantByToken(token);
    if (!deleted) {
      return NextResponse.json({ error: "Interview not found." }, { status: 404 });
    }
    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("interview/delete failed", err);
    return NextResponse.json({ error: "Could not delete — please try again." }, { status: 500 });
  }
}
