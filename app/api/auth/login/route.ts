import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (password !== process.env.APP_PASSWORD) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );
  session.isLoggedIn = true;
  await session.save();

  return NextResponse.json({ ok: true });
}
