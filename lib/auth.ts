import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData, Role } from "@/lib/session";

export async function getSessionRole(): Promise<Role | undefined> {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  return session.role;
}

export async function requireEdit(): Promise<NextResponse | null> {
  const role = await getSessionRole();
  if (role !== "edit") {
    return NextResponse.json({ error: "View-only mode" }, { status: 403 });
  }
  return null;
}
