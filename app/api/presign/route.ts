import { NextRequest, NextResponse } from "next/server";
import { getPresignedUrl } from "@/lib/s3";

export async function POST(request: NextRequest) {
  const { key } = await request.json();
  if (!key) return NextResponse.json({ error: "key required" }, { status: 400 });

  const url = await getPresignedUrl(key);
  return NextResponse.json({ url });
}
