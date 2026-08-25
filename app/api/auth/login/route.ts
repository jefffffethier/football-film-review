import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData, Role } from "@/lib/session";

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  let role: Role | undefined;
  if (password === process.env.APP_PASSWORD_EDIT) {
    role = "edit";
  } else if (password === process.env.APP_PASSWORD_VIEW) {
    role = "view";
  }

  if (!role) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );
  session.role = role;
  await session.save();

  return NextResponse.json({ ok: true });
}
