import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await getSupabase()
    .from("games")
    .select("*, plays(count)")
    .order("date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const games = (data ?? []).map((g) => {
    const { plays, ...rest } = g as typeof g & { plays: { count: number }[] };
    return { ...rest, play_count: plays?.[0]?.count ?? 0 };
  });

  return NextResponse.json(games);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, date, home_team, away_team, video_source, video_ref } = body;

  const { data, error } = await getSupabase()
    .from("games")
    .insert({ title, date, home_team, away_team, video_source, video_ref, downs_config: 4 })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
