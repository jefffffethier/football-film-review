import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  // Only allow editing metadata — video source/ref are intentionally excluded
  const { title, date, opponent, downs_config } = body;
  const patch: Record<string, unknown> = {};
  if (title !== undefined) patch.title = title;
  if (date !== undefined) patch.date = date;
  if (opponent !== undefined) patch.opponent = opponent;
  if (downs_config !== undefined) patch.downs_config = downs_config;

  const { data, error } = await getSupabase()
    .from("games")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await getSupabase().from("games").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
