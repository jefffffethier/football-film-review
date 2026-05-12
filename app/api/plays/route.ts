import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    game_id, start_time, end_time, down, yard_line,
    field_zone, play_type, formation, result, notes,
  } = body;

  const { data, error } = await getSupabase()
    .from("plays")
    .insert({
      game_id, start_time, end_time, down, yard_line,
      field_zone, play_type, formation, result, notes,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
