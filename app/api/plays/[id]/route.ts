import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { requireEdit } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireEdit();
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json();
  const { start_time, end_time, down, yard_line, field_zone, play_type, formation, result, possession, play_name, notes } = body;

  const patch: Record<string, unknown> = { down, yard_line, field_zone, play_type, formation, result, possession, play_name, notes };
  if (start_time !== undefined) patch.start_time = start_time;
  if (end_time !== undefined) patch.end_time = end_time;

  const { data, error } = await getSupabase()
    .from("plays")
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
  const denied = await requireEdit();
  if (denied) return denied;

  const { id } = await params;
  const { error } = await getSupabase().from("plays").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
